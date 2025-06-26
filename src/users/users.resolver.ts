import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from 'src/graphql/users.model';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { CurrentUserDecorator } from 'src/common/decorators/current-user.decorator';
import { CurrentUser } from 'src/auth/types/current-user';
import { UpdateUserResponse } from 'src/graphql/special/UpdateUserResponse';
import { UpdateUserInput } from './dto/updateUser.dto';
import { DailyPhoto } from 'src/graphql/dailyPhoto.model';
import { DailyPhotosService } from 'src/daily-photos/daily-photos.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly dailyPhotosService: DailyPhotosService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  async me(@CurrentUserDecorator() currentUser: CurrentUser) {
    return await this.usersService.getUser(currentUser.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UpdateUserResponse)
  async updataUser(
    @CurrentUserDecorator() currentUser: CurrentUser,
    @Args('input') input: UpdateUserInput,
  ) {
    const { email, ...profileData } = input;

    const [user, userProfile] = await Promise.all([
      email ? this.usersService.updateUser(currentUser.id, email) : null,
      Object.keys(profileData).length > 0
        ? this.usersService.updateUserProfile(currentUser.id, profileData)
        : null,
    ]);

    return { user, userProfile };
  }

  // @Mutation(() => UploadResponse)
  // async uploadAvatarMock(): Promise<UploadResponse> {
  //   const filePath = join(__dirname, '../test-assets/imagebackground.png');
  //   const buffer = await fs.readFile(filePath);
  //   const base64 = buffer.toString('base64');
  //   const dataUri = `data:image/jpeg;base64,${base64}`;

  //   const result = await this.usersService.uploadAvatarToCloudinary(
  //     dataUri,
  //     123,
  //   ); // моковий userId
  //   console.log('Cloudinary Result:', result);

  //   return { url: result.secure_url };
  // }

  @UseGuards(GqlAuthGuard)
  @Query(() => String)
  async delete(@CurrentUserDecorator() currentUser: CurrentUser) {
    await this.usersService.deleteUser(currentUser.id);
    return 'Successfully issued';
  }

  @ResolveField(() => [DailyPhoto])
  async dailyPhotos(@Parent() user: User) {
    return await this.dailyPhotosService.findByUserId(user.id);
  }
}
