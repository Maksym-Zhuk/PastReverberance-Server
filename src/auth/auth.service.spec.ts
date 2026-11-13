import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { createApp, resetDb, validUser } from '../../test/helpers';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let app: NestFastifyApplication;
  let service: AuthService;

  beforeAll(async () => {
    app = await createApp();
    service = app.get(AuthService, { strict: false });
  });
  afterAll(() => app.close());
  beforeEach(resetDb);

  it('stores a bcrypt hash, never the plain password, and omits it from the result', async () => {
    const { user } = await service.register(validUser);
    expect(user).not.toHaveProperty('password');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const { rows } = await pool.query('SELECT password FROM users');
    await pool.end();
    expect(rows[0].password).not.toBe(validUser.password);
    expect(await bcrypt.compare(validUser.password, rows[0].password)).toBe(
      true,
    );
  });

  it('signs access and refresh tokens with different secrets', async () => {
    const { accessToken, refreshToken, user } =
      await service.register(validUser);
    const sub = user!.id;

    expect(jwt.verify(accessToken, process.env.JWT_SECRET!)).toMatchObject({
      sub,
    });
    expect(
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!),
    ).toMatchObject({ sub });
    expect(() =>
      jwt.verify(accessToken, process.env.JWT_REFRESH_SECRET!),
    ).toThrow();
    expect(() => jwt.verify(refreshToken, process.env.JWT_SECRET!)).toThrow();
  });

  it('rejects duplicate registration', async () => {
    await service.register(validUser);
    await expect(service.register(validUser)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('login fails for unknown user and wrong password', async () => {
    await service.register(validUser);
    await expect(
      service.login({
        email: 'nobody@example.com',
        password: validUser.password,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      service.login({ email: validUser.email, password: 'Wr0ng!Passw0rd' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validateJwtUser returns id+role, rejects deleted user', async () => {
    const { user } = await service.register(validUser);
    await expect(service.validateJwtUser(user!.id)).resolves.toEqual({
      id: user!.id,
      role: 'USER',
    });
    await expect(service.validateJwtUser(9999)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('validateRefreshToken issues a new access token only for existing users', async () => {
    const { user } = await service.register(validUser);
    const { accessToken } = await service.validateRefreshToken(user!.id);
    expect(jwt.verify(accessToken, process.env.JWT_SECRET!)).toMatchObject({
      sub: user!.id,
    });
    await expect(service.validateRefreshToken(9999)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
