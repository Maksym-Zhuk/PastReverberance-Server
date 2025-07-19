import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { cloudinary } from 'src/common/config/cloudinary.config';
import { DRIZZLE } from 'src/drizzle/drizzle.token';
import { dailyPhotos } from 'src/drizzle/schema/dailyPhotos.schema';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { UpdateDailyPhotoInput } from './dto/updateDailyPhotoInput';

@Injectable()
export class DailyPhotosService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async uploadDailyPhotoToCloudinary(
    dataUri: string,
    userId: number,
  ): Promise<{ secure_url: string; public_id: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await cloudinary.uploader.upload(dataUri, {
        public_id: `past-reverberance/photos/user_${userId}_${Date.now()}`,
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
      if (error instanceof Error) {
        console.error('Cloudinary upload error:', error.message);
      } else {
        console.error('Unknown error during Cloudinary upload', error);
      }
      throw new Error('Failed to upload avatar');
    }
  }

  async createDailyPhoto(userId: number, photoUrl: string, photoId: string) {
    const dailyPhoto = await this.db
      .insert(dailyPhotos)
      .values({ photoUrl, userId, photoId, date: new Date().toISOString() })
      .returning();

    return dailyPhoto[0];
  }

  findByUserId(userId: number) {
    return this.db
      .select()
      .from(dailyPhotos)
      .where(eq(dailyPhotos.userId, userId));
  }

  async getDailyPhotos(userId: number) {
    return await this.db
      .select()
      .from(dailyPhotos)
      .where(eq(dailyPhotos.userId, userId));
  }

  async getDailyPhotoByID(id: number) {
    const dailyPhoto = await this.db.query.dailyPhotos.findFirst({
      where: (dailyPhoto) => eq(dailyPhoto.id, id),
    });

    if (!dailyPhoto) throw new UnauthorizedException('Daily photo not found!');
    return dailyPhoto;
  }

  async update(input: UpdateDailyPhotoInput) {
    const { id, ...dailyPhoto } = input;

    const updateDailyPhoto = await this.db
      .update(dailyPhotos)
      .set({ ...dailyPhoto })
      .where(eq(dailyPhotos.id, id))
      .returning();

    return updateDailyPhoto[0];
  }

  async delete(id: number) {
    return await this.db.delete(dailyPhotos).where(eq(dailyPhotos.id, id));
  }
}
