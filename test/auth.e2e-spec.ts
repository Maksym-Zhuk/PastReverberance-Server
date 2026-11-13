import { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createApp,
  cookiesOf,
  registerUser,
  resetDb,
  validUser,
} from './helpers';

describe('Auth (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(() => app.close());
  beforeEach(resetDb);

  const post = (url: string, payload?: object, cookie?: string) =>
    app.inject({
      method: 'POST',
      url,
      payload,
      headers: cookie ? { cookie } : {},
    });

  describe('POST /auth/register', () => {
    it('creates user, sets httpOnly cookies, hides password', async () => {
      const res = await post('/auth/register', validUser);

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toMatchObject({
        email: validUser.email,
        role: 'USER',
        profile: { firstName: 'John', lastName: 'Doe' },
      });
      expect(body).not.toHaveProperty('password');
      expect(res.cookies.map((c) => c.name).sort()).toEqual([
        'accessToken',
        'refreshToken',
      ]);
      expect(res.cookies.every((c) => c.httpOnly)).toBe(true);
    });

    it('rejects duplicate email with 409', async () => {
      await post('/auth/register', validUser);
      const res = await post('/auth/register', validUser);
      expect(res.statusCode).toBe(409);
    });

    it.each([
      ['invalid email', { ...validUser, email: 'nope' }],
      ['weak password', { ...validUser, password: 'password' }],
      [
        'missing profile',
        { email: validUser.email, password: validUser.password },
      ],
      [
        'empty first name',
        { ...validUser, profile: { firstName: '', lastName: 'x' } },
      ],
    ])('rejects %s with 400', async (_name, payload) => {
      const res = await post('/auth/register', payload);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(() => registerUser(app));

    it('logs in with correct credentials', async () => {
      const res = await post('/auth/login', {
        email: validUser.email,
        password: validUser.password,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).not.toHaveProperty('password');
      expect(res.cookies.map((c) => c.name)).toContain('accessToken');
    });

    it('does not apply strength rules on login (wrong weak password is 401, not 400)', async () => {
      const res = await post('/auth/login', {
        email: validUser.email,
        password: 'weak',
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().message).toBe('Invalid email or password');
    });

    it('rejects wrong password with 401', async () => {
      const res = await post('/auth/login', {
        email: validUser.email,
        password: 'Wr0ng!Passw0rd',
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unknown email with 401', async () => {
      const res = await post('/auth/login', {
        email: 'ghost@example.com',
        password: validUser.password,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns a new access token for a valid refresh cookie', async () => {
      const { cookie } = await registerUser(app);
      const res = await post('/auth/refresh', undefined, cookie);
      expect(res.statusCode).toBe(200);
      expect(typeof res.json().accessToken).toBe('string');
      expect(res.cookies.map((c) => c.name)).toContain('accessToken');
    });

    it('returns 401 without cookie', async () => {
      expect((await post('/auth/refresh')).statusCode).toBe(401);
    });

    it('returns 401 for a forged refresh token', async () => {
      const res = await post(
        '/auth/refresh',
        undefined,
        'refreshToken=forged.token.value',
      );
      expect(res.statusCode).toBe(401);
    });

    it('does not accept an access token as refresh token', async () => {
      const reg = await post('/auth/register', validUser);
      const access = reg.cookies.find((c) => c.name === 'accessToken')!.value;
      const res = await post(
        '/auth/refresh',
        undefined,
        `refreshToken=${access}`,
      );
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears both cookies', async () => {
      const { cookie } = await registerUser(app);
      const res = await post('/auth/logout', undefined, cookie);
      expect(res.statusCode).toBe(204);
      const cleared = Object.fromEntries(
        res.cookies.map((c) => [c.name, c.value]),
      );
      expect(cleared).toEqual({ accessToken: '', refreshToken: '' });
      expect(cookiesOf(res)).not.toContain('accessToken=ey');
    });
  });
});
