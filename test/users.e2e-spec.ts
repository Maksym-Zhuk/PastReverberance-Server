import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DailyPhotosService } from 'src/daily-photos/daily-photos.service';
import {
  createApp,
  multipart,
  registerUser,
  resetDb,
  validUser,
} from './helpers';

describe('Users (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(() => app.close());
  beforeEach(resetDb);

  const call = (
    method: 'GET' | 'PATCH' | 'DELETE',
    cookie?: string,
    payload?: object,
  ) =>
    app.inject({
      method,
      url: '/users/me',
      payload,
      headers: cookie ? { cookie } : {},
    });

  it('GET /users/me requires auth', async () => {
    expect((await call('GET')).statusCode).toBe(401);
  });

  it('GET /users/me returns profile without password', async () => {
    const { cookie } = await registerUser(app);
    const res = await call('GET', cookie);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      email: validUser.email,
      profile: { firstName: 'John', lastName: 'Doe', description: '' },
    });
    expect(res.json()).not.toHaveProperty('password');
  });

  it('PATCH updates only firstName', async () => {
    const { cookie } = await registerUser(app);
    const res = await call('PATCH', cookie, { firstName: 'Jane' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      email: validUser.email,
      profile: { firstName: 'Jane', lastName: 'Doe' },
    });
  });

  it('PATCH updates only email', async () => {
    const { cookie } = await registerUser(app);
    const res = await call('PATCH', cookie, { email: 'new@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      email: 'new@example.com',
      profile: { firstName: 'John' },
    });
  });

  it('PATCH rejects invalid email and unknown fields are stripped', async () => {
    const { cookie } = await registerUser(app);
    expect((await call('PATCH', cookie, { email: 'bad' })).statusCode).toBe(
      400,
    );

    const res = await call('PATCH', cookie, {
      role: 'ADMIN',
      lastName: 'Smith',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().role).toBe('USER');
  });

  it('DELETE removes user and their photos, session stops working', async () => {
    jest
      .spyOn(DailyPhotosService.prototype, 'uploadDailyPhotoToCloudinary')
      .mockResolvedValue({ secure_url: 'https://x/y.png', public_id: 'y' });
    const { cookie } = await registerUser(app);
    const form = multipart(
      {},
      { name: 'a.png', type: 'image/png', content: Buffer.from('img') },
    );
    const created = await app.inject({
      method: 'POST',
      url: '/daily-photos',
      payload: form.payload,
      headers: { ...form.headers, cookie },
    });
    expect(created.statusCode).toBe(201);

    expect((await call('DELETE', cookie)).statusCode).toBe(204);
    expect((await call('GET', cookie)).statusCode).toBe(401);

    const again = await registerUser(app);
    const list = await app.inject({
      method: 'GET',
      url: '/daily-photos',
      headers: { cookie: again.cookie },
    });
    expect(list.json()).toEqual([]);
  });

  it('PATCH to an email that is already taken returns 409', async () => {
    await registerUser(app, { email: 'taken@example.com' });
    const { cookie } = await registerUser(app, { email: 'me@example.com' });
    const res = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      payload: { email: 'taken@example.com' },
      headers: { cookie },
    });
    expect(res.statusCode).toBe(409);
  });
});
