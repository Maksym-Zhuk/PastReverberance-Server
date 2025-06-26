import { Mutation, Resolver } from '@nestjs/graphql';
import { DailyPhotosService } from './daily-photos.service';
import { Req, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { DailyPhoto } from 'src/graphql/dailyPhoto.model';
import { FastifyRequest } from 'fastify';
import { CurrentUser } from 'src/auth/types/current-user';
import { CurrentUserDecorator } from 'src/common/decorators/current-user.decorator';
import { MultipartFile } from '@fastify/multipart';

interface SafeMultipartFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
}

@Resolver()
export class DailyPhotosResolver {
  constructor(private readonly dailyPhotosService: DailyPhotosService) {}

  private async safeGetFile(
    req: FastifyRequest & { file: () => Promise<MultipartFile> },
  ): Promise<SafeMultipartFile> {
    let file: unknown;
    try {
      file = await req.file();
    } catch {
      throw new Error('Error retrieving file');
    }

    if (
      file &&
      typeof file === 'object' &&
      file !== null &&
      !(file instanceof Error) &&
      'fieldname' in file &&
      'filename' in file &&
      'encoding' in file &&
      'mimetype' in file &&
      'toBuffer' in file &&
      typeof (file as { fieldname?: unknown }).fieldname === 'string' &&
      typeof (file as { filename?: unknown }).filename === 'string' &&
      typeof (file as { encoding?: unknown }).encoding === 'string' &&
      typeof (file as { mimetype?: unknown }).mimetype === 'string' &&
      typeof (file as { toBuffer?: unknown }).toBuffer === 'function'
    ) {
      return file as SafeMultipartFile;
    }

    throw new Error('Invalid or missing file');
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => DailyPhoto)
  async createDailyPhoto(
    @Req() req: FastifyRequest,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const file = await this.safeGetFile(
      req as FastifyRequest & { file: () => Promise<MultipartFile> },
    );

    const buffer = await file.toBuffer();
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;
    const result = await this.dailyPhotosService.uploadDailyPhotoToCloudinary(
      dataUri,
      currentUser.id,
    );
    const dailyPhoto = await this.dailyPhotosService.createDailyPhoto(
      currentUser.id,
      result.secure_url,
    );
    return dailyPhoto;
  }
}
