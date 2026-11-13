import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/drizzle/drizzle.token';
import { profileInfo } from 'src/drizzle/schema/profileInfo.schema';
import { users } from 'src/drizzle/schema/users.schema';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { omitPassword } from 'src/common/omit-password';
import { isUniqueViolation } from 'src/common/is-unique-violation';
import { UpdateProfileInput } from './dto/updateProfileInput';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getUser(userId: number) {
    const user = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, userId),
      with: {
        profile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found!');
    return omitPassword(user);
  }

  async updateUser(userId: number, email: string) {
    const user = await this.db
      .update(users)
      .set({ email })
      .where(eq(users.id, userId))
      .returning()
      .catch((e: unknown) => {
        if (isUniqueViolation(e))
          throw new ConflictException('Email already in use');
        throw e;
      });

    if (!user[0]) throw new NotFoundException('User not found!');
    return omitPassword(user[0]);
  }

  async updateUserProfile(userId: number, profileData: UpdateProfileInput) {
    const profile = await this.db
      .update(profileInfo)
      .set(profileData)
      .where(eq(profileInfo.userId, userId))
      .returning();

    if (!profile[0]) throw new NotFoundException('Profile not found!');
    return profile[0];
  }

  async deleteUser(userId: number) {
    await this.db.transaction(async (tx) => {
      await tx.delete(profileInfo).where(eq(profileInfo.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
  }
}
