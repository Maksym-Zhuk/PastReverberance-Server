import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from 'src/graphql/users.model';
import { RegisterInput } from './dto/register.dto';
import { LoginInput } from './dto/login.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { GqlRefreshJwtGuard } from 'src/common/guards/gqlRefreshJwt.guard';
import { refreshResponse } from 'src/graphql/special/refreshResponse';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => User)
  async register(
    @Args('input') input: RegisterInput,
    @Context() context: { reply: FastifyReply },
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(input);

    context.reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    context.reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return user;
  }

  @Mutation(() => User)
  async login(
    @Args('input') input: LoginInput,
    @Context() context: { reply: FastifyReply },
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(input);

    context.reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    context.reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return user;
  }

  @UseGuards(GqlRefreshJwtGuard)
  @Mutation(() => refreshResponse)
  refreshToken(
    @Context() context: { reply: FastifyReply; req: FastifyRequest },
  ) {
    const user = context.req.user;
    if (!user || !user.accessToken) {
      throw new UnauthorizedException('User not found in request');
    }

    return user;
  }

  @Query(() => String)
  logout(@Context() context: { reply: FastifyReply }) {
    context.reply.clearCookie('accessToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    });
    context.reply.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    });
    return 'Logout done';
  }
}
