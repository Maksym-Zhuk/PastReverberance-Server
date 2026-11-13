import {
  BadRequestException,
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

  // multipart body -> optional image data URI + text fields
  private async readParts(req: FastifyRequest) {
    let dataUri: string | undefined;
    const fields: Record<string, unknown> = {};

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        if (!part.mimetype.startsWith('image/'))
          throw new BadRequestException('Only image files are allowed');
        dataUri = `data:${part.mimetype};base64,${buffer.toString('base64')}`;
      } else {
        fields[part.fieldname] = part.value;
      }
    }
    return { dataUri, fields };
  }

  private async validated<T extends object>(
    cls: new () => T,
    fields: unknown,
  ): Promise<T> {
    const input = plainToInstance(cls, fields ?? {});
    const errors = await validate(input, { whitelist: true });
    if (errors.length) throw new BadRequestException(errors.toString());
    return input;
  }

  @Post()
  async create(
    @Req() req: FastifyRequest,
    @CurrentUserDecorator() user: CurrentUser,
  ) {
    const { dataUri, fields } = await this.readParts(req);
    if (!dataUri) throw new BadRequestException('File is required');
    const input = await this.validated(CreateDailyPhotoInput, fields);

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

  // JSON (note/date) or multipart (note/date + optional replacement photo)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserDecorator() user: CurrentUser,
    @Req() req: FastifyRequest,
  ) {
    let dataUri: string | undefined;
    let raw: unknown = req.body;
    if (req.isMultipart()) {
      ({ dataUri, fields: raw } = await this.readParts(req));
    }
    const input = await this.validated(UpdateDailyPhotoInput, raw);
    return this.dailyPhotosService.update(id, user.id, input, dataUri);
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
