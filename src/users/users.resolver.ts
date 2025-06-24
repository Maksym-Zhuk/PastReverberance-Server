import { Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from 'src/graphql/users.model';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { CurrentUserDecorator } from 'src/common/decorators/current-user.decorator';
import { CurrentUser } from 'src/auth/types/current-user';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  async me(@CurrentUserDecorator() currentUser: CurrentUser) {
    return await this.usersService.getUser(currentUser);
  }
}
