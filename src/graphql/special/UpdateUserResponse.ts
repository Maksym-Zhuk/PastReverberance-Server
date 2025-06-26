import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../users.model';
import { ProfileInfo } from '../profileInfo.model';
@ObjectType()
export class UpdateUserResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => ProfileInfo, { nullable: true })
  profile?: ProfileInfo;
}
