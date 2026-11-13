import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { cloudinary } from 'src/common/config/cloudinary.config';
import { DRIZZLE } from 'src/drizzle/drizzle.token';
import { dailyPhotos } from 'src/drizzle/schema/dailyPhotos.schema';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { UpdateDailyPhotoInput } from './dto/updateDailyPhotoInput';

@Injectable()
export class DailyPhotosService {
  private readonly logger = new Logger(DailyPhotosService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async uploadDailyPhotoToCloudinary(
    dataUri: string,
    userId: number,
  ): Promise<{ secure_url: string; public_id: string }> {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      throw new ServiceUnavailableException(
        'Photo storage is not configured (Cloudinary env vars are empty)',
      );
    }
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        public_id: `user_${userId}_${Date.now()}`,
        folder: 'past-reverberance/photos',
        overwrite: true,
        invalidate: false,
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { fetch_format: 'auto' },
          { quality: 'auto' },
        ],
      });

      return { secure_url: result.secure_url, public_id: result.public_id };
    } catch (error) {
      this.logger.error(
        'Cloudinary upload error',
        // cloudinary rejects with a plain object ({ message, http_code }), not an Error
        error instanceof Error ? error.message : JSON.stringify(error),
      );
      throw new ServiceUnavailableException('Failed to upload photo');
    }
  }

  async createDailyPhoto(
    userId: number,
    photoUrl: string,
    photoId: string,
    extra: { note?: string; date?: string } = {},
  ) {
    const dailyPhoto = await this.db
      .insert(dailyPhotos)
      .values({
        photoUrl,
        userId,
        photoId,
        note: extra.note,
        date: extra.date ?? new Date().toISOString(),
      })
      .returning();

    return dailyPhoto[0];
  }

  findByUserId(userId: number) {
    return this.db
      .select()
      .from(dailyPhotos)
      .where(eq(dailyPhotos.userId, userId))
      .orderBy(desc(dailyPhotos.date), desc(dailyPhotos.id));
  }

  getDailyPhotos(userId: number) {
    return this.findByUserId(userId);
  }

  async getDailyPhotoByID(id: number, userId: number) {
    const dailyPhoto = await this.db.query.dailyPhotos.findFirst({
      where: (p) => and(eq(p.id, id), eq(p.userId, userId)),
    });
    if (!dailyPhoto) throw new NotFoundException('Daily photo not found!');
    return dailyPhoto;
  }

  async update(id: number, userId: number, input: UpdateDailyPhotoInput) {
    const values = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(values).length === 0)
      return this.getDailyPhotoByID(id, userId);

    const [updated] = await this.db
      .update(dailyPhotos)
      .set(values)
      .where(and(eq(dailyPhotos.id, id), eq(dailyPhotos.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundException('Daily photo not found!');
    return updated;
  }

  async delete(id: number, userId: number) {
    const deleted = await this.db
      .delete(dailyPhotos)
      .where(and(eq(dailyPhotos.id, id), eq(dailyPhotos.userId, userId)))
      .returning({ id: dailyPhotos.id, photoId: dailyPhotos.photoId });
    if (!deleted[0]) throw new NotFoundException('Daily photo not found!');
    // best effort: the DB row is already gone, don't fail the request
    if (!process.env.CLOUDINARY_CLOUD_NAME) return;
    try {
      await cloudinary.uploader.destroy(deleted[0].photoId);
    } catch (e) {
      this.logger.warn(`Cloudinary destroy failed: ${String(e)}`);
    }
  }
}
