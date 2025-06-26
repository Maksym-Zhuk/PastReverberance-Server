import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { cloudinary } from 'src/common/config/cloudinary.config';
import { DRIZZLE } from 'src/drizzle/drizzle.token';
import { dailyPhotos } from 'src/drizzle/schema/dailyPhotos.schema';
import { DrizzleDB } from 'src/drizzle/types/drizzle';

@Injectable()
export class DailyPhotosService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async uploadDailyPhotoToCloudinary(
    dataUri: string,
    userId: number,
  ): Promise<{ secure_url: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await cloudinary.uploader.upload(dataUri, {
        public_id: `past-reverberance/photos/user_${userId}_${Date.now()}`,
        folder: 'past-reverberance/photos',
        overwrite: false,
        invalidate: false,
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { fetch_format: 'auto' },
          { quality: 'auto' },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return { secure_url: result.secure_url };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Cloudinary upload error:', error.message);
      } else {
        console.error('Unknown error during Cloudinary upload', error);
      }
      throw new Error('Failed to upload avatar');
    }
  }

  async createDailyPhoto(userId: number, photoUrl: string) {
    const dailyPhoto = await this.db
      .insert(dailyPhotos)
      .values({ photoUrl, userId })
      .returning();

    return dailyPhoto[0];
  }

  findByUserId(userId: number) {
    return this.db
      .select()
      .from(dailyPhotos)
      .where(eq(dailyPhotos.userId, userId));
  }
}
