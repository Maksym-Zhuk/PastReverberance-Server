import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DailyPhoto {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field()
  photoUrl: string;

  @Field({ nullable: true })
  note?: string;

  @Field()
  createdAt: Date;
}
