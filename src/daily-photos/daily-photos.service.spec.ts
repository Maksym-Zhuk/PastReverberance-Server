import { NotFoundException } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp, resetDb, validUser } from '../../test/helpers';
import { AuthService } from '../auth/auth.service';
import { DailyPhotosService } from './daily-photos.service';

describe('DailyPhotosService', () => {
  let app: NestFastifyApplication;
  let photos: DailyPhotosService;
  let owner: number;
  let other: number;

  beforeAll(async () => {
    app = await createApp();
    photos = app.get(DailyPhotosService, { strict: false });
  });
  afterAll(() => app.close());
  beforeEach(async () => {
    await resetDb();
    const auth = app.get(AuthService, { strict: false });
    owner = (await auth.register(validUser)).user!.id;
    other = (await auth.register({ ...validUser, email: 'o@example.com' }))
      .user!.id;
  });

  it('createDailyPhoto stores note/date, defaults date', async () => {
    const withDate = await photos.createDailyPhoto(owner, 'u', 'p', {
      note: 'n',
      date: '2026-01-01T00:00:00.000Z',
    });
    expect(withDate).toMatchObject({
      note: 'n',
      date: '2026-01-01T00:00:00.000Z',
    });

    const bare = await photos.createDailyPhoto(owner, 'u', 'p2');
    expect(bare.note).toBeNull();
    expect(new Date(bare.date).getTime()).not.toBeNaN();
  });

  it('read/update/delete are scoped to the owner', async () => {
    const { id } = await photos.createDailyPhoto(owner, 'u', 'p');

    await expect(photos.getDailyPhotoByID(id, other)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      photos.update(id, other, { note: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(photos.delete(id, other)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(photos.getDailyPhotoByID(id, owner)).resolves.toMatchObject({
      id,
    });
  });

  it('update ignores undefined fields and tolerates an empty patch', async () => {
    const { id } = await photos.createDailyPhoto(owner, 'u', 'p', {
      note: 'keep',
    });
    const same = await photos.update(id, owner, {
      note: undefined,
      date: undefined,
    });
    expect(same.note).toBe('keep');
    const changed = await photos.update(id, owner, { date: '2027-01-01' });
    expect(changed).toMatchObject({ note: 'keep', date: '2027-01-01' });
  });

  it('getDailyPhotos lists only own photos', async () => {
    await photos.createDailyPhoto(owner, 'u', 'a');
    await photos.createDailyPhoto(other, 'u', 'b');
    expect(await photos.getDailyPhotos(owner)).toHaveLength(1);
  });
});
