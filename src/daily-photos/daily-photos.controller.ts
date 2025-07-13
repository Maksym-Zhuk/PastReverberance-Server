import {
  Controller,
  Post,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { DailyPhotosService } from './daily-photos.service';
import { MultipartFile } from '@fastify/multipart';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/types/current-user';

@Controller('upload')
export class DailyPhotosController {
  constructor(private readonly dailyPhotosService: DailyPhotosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('daily-photo')
  async uploadDailyPhoto(
    @Req() req: FastifyRequest & { file: () => Promise<MultipartFile> },
  ) {
    const user = req.user as unknown as CurrentUser;
    const uploadedFile = await req.file();
    if (!uploadedFile) {
      throw new BadRequestException('Файл не надіслано');
    }

    const buffer = await uploadedFile.toBuffer();
    const base64 = buffer.toString('base64');
    const dataUri = `data:${uploadedFile.mimetype};base64,${base64}`;

    const uploadResult =
      await this.dailyPhotosService.uploadDailyPhotoToCloudinary(
        dataUri,
        user.id,
      );

    const createdPhoto = await this.dailyPhotosService.createDailyPhoto(
      user.id,
      uploadResult.secure_url,
      uploadResult.public_id,
    );

    return createdPhoto;
  }
}
