import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { jwtConfig } from '../config/jwt.config';
import { cookieExtractor } from 'src/common/extractors/cookieExtractor';

export interface AuthJwtPayload {
  sub: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private authService: AuthService,
  ) {
    if (!jwtConfiguration.secret) {
      throw new Error('JWT secret не визначений');
    }

    super({
      jwtFromRequest: cookieExtractor('accessToken'),
      secretOrKey: jwtConfiguration.secret as string | Buffer,
      ignoreExpiration: false,
    });
  }

  override validate(payload: AuthJwtPayload) {
    const userId = payload.sub;
    return this.authService.validateJwtUser(userId);
  }
}
