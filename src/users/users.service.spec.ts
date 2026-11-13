import { NotFoundException } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp, resetDb, validUser } from '../../test/helpers';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let app: NestFastifyApplication;
  let users: UsersService;
  let userId: number;

  beforeAll(async () => {
    app = await createApp();
    users = app.get(UsersService, { strict: false });
  });
  afterAll(() => app.close());
  beforeEach(async () => {
    await resetDb();
    const { user } = await app
      .get(AuthService, { strict: false })
      .register(validUser);
    userId = user!.id;
  });

  it('getUser returns profile without password; unknown id → NotFound', async () => {
    const user = await users.getUser(userId);
    expect(user).not.toHaveProperty('password');
    expect(user.profile).toMatchObject({ firstName: 'John' });
    await expect(users.getUser(9999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateUser changes email and returns a single object', async () => {
    const updated = await users.updateUser(userId, 'new@example.com');
    expect(updated).toMatchObject({ id: userId, email: 'new@example.com' });
    expect(updated).not.toHaveProperty('password');
  });

  it('updateUserProfile updates only provided fields', async () => {
    const profile = await users.updateUserProfile(userId, {
      description: 'hi',
    });
    expect(profile).toMatchObject({
      firstName: 'John',
      lastName: 'Doe',
      description: 'hi',
    });
  });

  it('deleteUser removes user and profile', async () => {
    await users.deleteUser(userId);
    await expect(users.getUser(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
