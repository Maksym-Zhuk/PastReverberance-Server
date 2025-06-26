import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UploadResponse {
  @Field()
  url: string;
}
