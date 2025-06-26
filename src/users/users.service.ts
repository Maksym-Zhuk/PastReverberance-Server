import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
// import { cloudinary } from 'src/common/config/cloudinary.config';
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
