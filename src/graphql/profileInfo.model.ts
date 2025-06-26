import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProfileInfo {
  @Field(() => Int)
  id: number;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  description: string;

  @Field()
  avatarUrl: string;
}
