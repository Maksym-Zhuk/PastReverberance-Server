import { Module } from '@nestjs/common';
import { DailyPhotosService } from './daily-photos.service';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { DailyPhotosController } from './daily-photos.controller';

@Module({
  imports: [DrizzleModule],
  providers: [DailyPhotosService],
  exports: [DailyPhotosService],
  controllers: [DailyPhotosController],
})
export class DailyPhotosModule {}
