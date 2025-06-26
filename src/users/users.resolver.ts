import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from 'src/graphql/users.model';
import { Req, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { CurrentUserDecorator } from 'src/common/decorators/current-user.decorator';
import { CurrentUser } from 'src/auth/types/current-user';
import { UploadResponse } from 'src/graphql/special/uploadResponse.model';
import { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';
import { UpdateUserResponse } from 'src/graphql/special/UpdateUserResponse';
import { UpdateUserInput } from './dto/updateUser.dto';
// import { promises as fs } from 'fs';
// import { join } from 'path';

interface SafeMultipartFile {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
}

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

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

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UploadResponse)
  async uploadAvatar(
    @Req() req: FastifyRequest,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ) {
    const file = await this.safeGetFile(
      req as FastifyRequest & { file: () => Promise<MultipartFile> },
    );

    const buffer = await file.toBuffer();
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;
    const result = await this.usersService.uploadAvatarToCloudinary(
      dataUri,
      currentUser.id,
    );
    await this.usersService.updateAvatarUrl(currentUser.id, result.secure_url);
    return { url: result.secure_url };
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
}
