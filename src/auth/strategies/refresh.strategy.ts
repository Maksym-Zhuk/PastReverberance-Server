import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import refreshJwtConfig from '../config/refreshJwt.config.js';
import type { ConfigType } from '@nestjs/config';
import { AuthJwtPayload } from '../types/auth-jwtPayload.js';
import { AuthService } from '../auth.service.js';
import { cookieExtractor } from '../../common/extractors/cookieExtractor';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private appService: AuthService,
  ) {
    super({
      jwtFromRequest: cookieExtractor('refreshToken'),
      secretOrKey: refreshJwtConfiguration.secret!,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  override validate(payload: AuthJwtPayload) {
    const userId = payload.sub;
    return this.appService.validateRefreshToken(userId);
  }
}
