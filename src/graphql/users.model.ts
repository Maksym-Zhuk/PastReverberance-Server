import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Role } from 'src/common/enums/role.enum';

@ObjectType()
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  login: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field(() => Role)
  role: Role;
}
