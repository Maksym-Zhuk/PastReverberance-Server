import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CurrentUser } from 'src/auth/types/current-user';
import { DRIZZLE } from 'src/drizzle/drizzle.token';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { User } from 'src/graphql/users.model';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getUser(currentUser: CurrentUser): Promise<User> {
    const user = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, currentUser.id),
    });
    if (!user) throw new UnauthorizedException('User not found!');
    return user;
  }
}
