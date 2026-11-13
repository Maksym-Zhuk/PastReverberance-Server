import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.dto';
import { LoginInput } from './dto/login.dto';
import { RefreshJwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

const DAY = 24 * 60 * 60;
// Browser talks to the API through the Next.js /api proxy (same origin), so
// 'lax' works and 'secure' is only needed (and only possible) over https.
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const;

function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
) {
  reply.setCookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: DAY,
  });
  reply.setCookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 30 * DAY,
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() input: RegisterInput,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(input);
    setAuthCookies(reply, accessToken, refreshToken);
    return user;
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() input: LoginInput,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(input);
    setAuthCookies(reply, accessToken, refreshToken);
    return user;
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  @HttpCode(200)
  refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const user = req.user;
    if (!user?.accessToken) throw new UnauthorizedException();
    reply.setCookie('accessToken', user.accessToken, {
      ...cookieOptions,
      maxAge: DAY,
    });
    return { accessToken: user.accessToken };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie('accessToken', cookieOptions);
    reply.clearCookie('refreshToken', cookieOptions);
  }
}
