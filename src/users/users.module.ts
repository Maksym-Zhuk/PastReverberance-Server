import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { DailyPhotosModule } from 'src/daily-photos/daily-photos.module';

@Module({
  imports: [DrizzleModule, DailyPhotosModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
