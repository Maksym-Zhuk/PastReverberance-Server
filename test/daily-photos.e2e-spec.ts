import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DailyPhotosService } from 'src/daily-photos/daily-photos.service';
import { cloudinary } from 'src/common/config/cloudinary.config';
import { createApp, multipart, registerUser, resetDb } from './helpers';

describe('Daily photos (e2e)', () => {
  let app: NestFastifyApplication;
  let uploads = 0;

  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(() => app.close());
  beforeEach(async () => {
    await resetDb();
    uploads = 0;
    jest
      .spyOn(DailyPhotosService.prototype, 'uploadDailyPhotoToCloudinary')
      .mockImplementation(async () => {
        uploads++;
        return {
          secure_url: `https://cdn/p${uploads}.png`,
          public_id: `p${uploads}`,
        };
      });
  });

  it('DELETE removes the image from Cloudinary too', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test';
    const destroy = jest
      .spyOn(cloudinary.uploader, 'destroy')
      .mockResolvedValue({ result: 'ok' });
    try {
      const { cookie } = await registerUser(app);
      const { id } = (await upload(cookie)).json();
      expect(
        (await req('DELETE', `/daily-photos/${id}`, cookie)).statusCode,
      ).toBe(204);
      expect(destroy).toHaveBeenCalledWith('p1');
    } finally {
      delete process.env.CLOUDINARY_CLOUD_NAME;
    }
  });

  const png = { name: 'a.png', type: 'image/png', content: Buffer.from('img') };

  const upload = (cookie: string, fields: Record<string, string> = {}) => {
    const form = multipart(fields, png);
    return app.inject({
      method: 'POST',
      url: '/daily-photos',
      payload: form.payload,
      headers: { ...form.headers, cookie },
    });
  };
  const req = (
    method: 'GET' | 'PATCH' | 'DELETE',
    url: string,
    cookie?: string,
    payload?: object,
  ) => app.inject({ method, url, payload, headers: cookie ? { cookie } : {} });

  it.each([
    ['GET', '/daily-photos'],
    ['GET', '/daily-photos/1'],
    ['PATCH', '/daily-photos/1'],
    ['DELETE', '/daily-photos/1'],
  ] as const)('%s %s requires auth', async (method, url) => {
    expect((await req(method, url)).statusCode).toBe(401);
  });

  it('POST creates a photo with note and date in a single request', async () => {
    const { cookie } = await registerUser(app);
    const date = '2026-01-02T00:00:00.000Z';
    const res = await upload(cookie, { note: 'hello', date });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      photoUrl: 'https://cdn/p1.png',
      note: 'hello',
      date,
    });
  });

  it('POST defaults date and allows no note', async () => {
    const { cookie } = await registerUser(app);
    const res = await upload(cookie);
    expect(res.statusCode).toBe(201);
    expect(res.json().note).toBeNull();
    expect(new Date(res.json().date).getTime()).not.toBeNaN();
  });

  it('POST rejects non-image files and invalid dates with 400', async () => {
    const { cookie } = await registerUser(app);
    const txt = multipart(
      {},
      { name: 'a.txt', type: 'text/plain', content: Buffer.from('x') },
    );
    const r1 = await app.inject({
      method: 'POST',
      url: '/daily-photos',
      payload: txt.payload,
      headers: { ...txt.headers, cookie },
    });
    expect(r1.statusCode).toBe(400);
    expect((await upload(cookie, { date: 'not-a-date' })).statusCode).toBe(400);
    expect(uploads).toBe(0);
  });

  it('GET list is sorted newest date first', async () => {
    const { cookie } = await registerUser(app);
    await upload(cookie, { note: 'old', date: '2026-01-01T00:00:00.000Z' });
    await upload(cookie, { note: 'new', date: '2026-03-01T00:00:00.000Z' });
    const res = await req('GET', '/daily-photos', cookie);
    expect(res.json().map((p: { note: string }) => p.note)).toEqual([
      'new',
      'old',
    ]);
  });

  it('POST without file returns 400 and does not upload', async () => {
    const { cookie } = await registerUser(app);
    const form = multipart({ note: 'x' });
    const res = await app.inject({
      method: 'POST',
      url: '/daily-photos',
      payload: form.payload,
      headers: { ...form.headers, cookie },
    });
    expect(res.statusCode).toBe(400);
    expect(uploads).toBe(0);
  });

  it('GET list contains only own photos', async () => {
    const a = await registerUser(app);
    const b = await registerUser(app, { email: 'b@example.com' });
    await upload(a.cookie, { note: 'a1' });
    await upload(a.cookie, { note: 'a2' });
    await upload(b.cookie, { note: 'b1' });

    const list = (await req('GET', '/daily-photos', a.cookie)).json();
    expect(list.map((p: { note: string }) => p.note).sort()).toEqual([
      'a1',
      'a2',
    ]);
  });

  it('GET/PATCH/DELETE own photo works', async () => {
    const { cookie } = await registerUser(app);
    const { id } = (await upload(cookie, { note: 'old' })).json();

    expect((await req('GET', `/daily-photos/${id}`, cookie)).json().note).toBe(
      'old',
    );

    const patched = await req('PATCH', `/daily-photos/${id}`, cookie, {
      note: 'new',
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().note).toBe('new');

    expect(
      (await req('PATCH', `/daily-photos/${id}`, cookie, {})).statusCode,
    ).toBe(200);

    expect(
      (await req('DELETE', `/daily-photos/${id}`, cookie)).statusCode,
    ).toBe(204);
    expect((await req('GET', `/daily-photos/${id}`, cookie)).statusCode).toBe(
      404,
    );
  });

  it("another user's photo is 404 for GET, PATCH and DELETE (and stays intact)", async () => {
    const owner = await registerUser(app);
    const intruder = await registerUser(app, { email: 'evil@example.com' });
    const { id } = (await upload(owner.cookie, { note: 'mine' })).json();

    for (const [method, payload] of [
      ['GET', undefined],
      ['PATCH', { note: 'hacked' }],
      ['DELETE', undefined],
    ] as const) {
      const res = await req(
        method,
        `/daily-photos/${id}`,
        intruder.cookie,
        payload,
      );
      expect(res.statusCode).toBe(404);
    }
    const still = await req('GET', `/daily-photos/${id}`, owner.cookie);
    expect(still.json().note).toBe('mine');
  });

  it('unknown id is 404, non-numeric id is 400', async () => {
    const { cookie } = await registerUser(app);
    expect((await req('GET', '/daily-photos/9999', cookie)).statusCode).toBe(
      404,
    );
    expect((await req('DELETE', '/daily-photos/9999', cookie)).statusCode).toBe(
      404,
    );
    expect((await req('GET', '/daily-photos/abc', cookie)).statusCode).toBe(
      400,
    );
  });
});
