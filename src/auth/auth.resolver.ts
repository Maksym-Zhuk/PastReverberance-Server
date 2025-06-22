import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from 'src/graphql/users.model';
import { Response } from 'express';
import { RegisterInput } from './dto/register.dto';
import { LoginInput } from './dto/login.dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => String)
  hello() {
    return 'Hello';
  }

  @Mutation(() => User)
  async register(
    @Context('res') res: Response,
    @Args('input') input: RegisterInput,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(input);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return user;
  }

  @Mutation(() => User)
  async login(@Context('res') res: Response, @Args('input') input: LoginInput) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(input);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return user;
  }
}
