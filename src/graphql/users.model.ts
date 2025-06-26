import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Role } from 'src/common/enums/role.enum';
import { ProfileInfo } from './profileInfo.model';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field(() => Role)
  role: Role;

  @Field(() => ProfileInfo, { nullable: true })
  profile?: ProfileInfo;
}
