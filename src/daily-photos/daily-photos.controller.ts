import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DailyPhotosService } from './daily-photos.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUserDecorator } from 'src/common/decorators/current-user.decorator';
import { CurrentUser } from 'src/auth/types/current-user';
import { UpdateDailyPhotoInput } from './dto/updateDailyPhotoInput';
import { CreateDailyPhotoInput } from './dto/createDailyPhotoInput';

@UseGuards(JwtAuthGuard)
@Controller('daily-photos')
export class DailyPhotosController {
  constructor(private readonly dailyPhotosService: DailyPhotosService) {}

  @Get()
  list(@CurrentUserDecorator() user: CurrentUser) {
    return this.dailyPhotosService.getDailyPhotos(user.id);
  }

  @Get(':id')
  get(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    return this.dailyPhotosService.getDailyPhotoByID(id, user.id);
  }

  @Post()
  async create(
    @Req() req: FastifyRequest,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    let buffer: Buffer | undefined;
    let mimetype = '';
    const fields: Record<string, unknown> = {};

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        buffer = await part.toBuffer();
        mimetype = part.mimetype;
      } else {
        fields[part.fieldname] = part.value;
      }
    }
    if (!buffer) throw new BadRequestException('File is required');
    if (!mimetype.startsWith('image/'))
      throw new BadRequestException('Only image files are allowed');

    const input = plainToInstance(CreateDailyPhotoInput, fields);
    const errors = await validate(input, { whitelist: true });
    if (errors.length) throw new BadRequestException(errors.toString());

    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const uploaded = await this.dailyPhotosService.uploadDailyPhotoToCloudinary(
      dataUri,
      user.id,
    );
    return this.dailyPhotosService.createDailyPhoto(
      user.id,
      uploaded.secure_url,
      uploaded.public_id,
      input,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
    @Body() input: UpdateDailyPhotoInput,
  ) {
    return this.dailyPhotosService.update(id, user.id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    await this.dailyPhotosService.delete(id, user.id);
  }
}
