import { Module } from '@nestjs/common';
import { DailyPhotosService } from './daily-photos.service';
import { DailyPhotosResolver } from './daily-photos.resolver';
import { DrizzleModule } from 'src/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [DailyPhotosResolver, DailyPhotosService],
  exports: [DailyPhotosService],
})
export class DailyPhotosModule {}
