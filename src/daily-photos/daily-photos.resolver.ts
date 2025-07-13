import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DailyPhoto } from 'src/graphql/dailyPhoto.model';
import { DailyPhotosService } from './daily-photos.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { CurrentUserDecorator } from 'src/common/decorators/current-user.decorator';
import { CurrentUser } from 'src/auth/types/current-user';
import { DeleteDailyPhotoInput } from './dto/deleteDailyPhotoInput';
import { UpdateDailyPhotoInput } from './dto/updateDailyPhotoInput';
import { getDailyPhotoByID } from './dto/getDailyPhotoByIDInput';

@Resolver()
export class DailyPhotosResolver {
  constructor(private readonly dailyPhotosService: DailyPhotosService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => [DailyPhoto])
  async getDailyPhotos(@CurrentUserDecorator() currentUser: CurrentUser) {
    return await this.dailyPhotosService.getDailyPhotos(currentUser.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => DailyPhoto)
  async getDailyPhotoByID(
    @Args('input', { type: () => getDailyPhotoByID })
    input: getDailyPhotoByID,
  ) {
    return await this.dailyPhotosService.getDailyPhotoByID(input.id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => DailyPhoto)
  async updateDailyPhoto(
    @Args('input', { type: () => UpdateDailyPhotoInput })
    input: UpdateDailyPhotoInput,
  ) {
    return await this.dailyPhotosService.update(input);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String)
  async deleteDailyPhoto(
    @Args('input', { type: () => DeleteDailyPhotoInput })
    input: DeleteDailyPhotoInput,
  ) {
    await this.dailyPhotosService.delete(input.id);
    return 'Successfully issued';
  }
}
