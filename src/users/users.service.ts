import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { cloudinary } from 'src/common/config/cloudinary.config';
import { DRIZZLE } from 'src/drizzle/drizzle.token';
import { profileInfo } from 'src/drizzle/schema/profileInfo.schema';
import { users } from 'src/drizzle/schema/users.schema';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { User } from 'src/graphql/users.model';
import { UpdateProfileInput } from './dto/updateProfileInput';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getUser(userId: number): Promise<User> {
    const user = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, userId),
      with: {
        profile: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found!');
    return user;
  }

  async uploadAvatarToCloudinary(
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

  async updateAvatarUrl(userId: number, avatarUrl: string): Promise<void> {
    await this.db
      .update(profileInfo)
      .set({ avatarUrl })
      .where(eq(profileInfo.userId, userId));
  }

  async updateUser(userId: number, email: string) {
    const user = await this.db
      .update(users)
      .set({ email })
      .where(eq(users.id, userId))
      .returning();

    if (!user) throw new UnauthorizedException('User not found!');
    return user;
  }

  async updateUserProfile(userId: number, profileData: UpdateProfileInput) {
    const profile = await this.db
      .update(profileInfo)
      .set(profileData)
      .where(eq(profileInfo.userId, userId))
      .returning();

    if (!profile) throw new UnauthorizedException('User not found!');
    return profile;
  }

  async deleteUser(userId: number) {
    await this.db.transaction(async (tx) => {
      await tx.delete(profileInfo).where(eq(profileInfo.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
  }
}
