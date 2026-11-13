import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from 'src/common/decorators/current-user.decorator';
import { CurrentUser } from 'src/auth/types/current-user';
import { UpdateUserInput } from './dto/updateUser.dto';

@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  me(@CurrentUserDecorator() currentUser: CurrentUser) {
    return this.usersService.getUser(currentUser.id);
  }

  @Patch()
  async update(
    @CurrentUserDecorator() currentUser: CurrentUser,
    @Body() input: UpdateUserInput,
  ) {
    const { email, ...rest } = input;
    const profileData = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    );
    if (email) await this.usersService.updateUser(currentUser.id, email);
    if (Object.keys(profileData).length > 0)
      await this.usersService.updateUserProfile(currentUser.id, profileData);
    return this.usersService.getUser(currentUser.id);
  }

  @Delete()
  @HttpCode(204)
  async remove(@CurrentUserDecorator() currentUser: CurrentUser) {
    await this.usersService.deleteUser(currentUser.id);
  }
}
