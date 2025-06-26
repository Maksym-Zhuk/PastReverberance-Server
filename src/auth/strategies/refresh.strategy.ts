import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import refreshJwtConfig from '../config/refreshJwt.config.js';
import type { ConfigType } from '@nestjs/config';
import { AuthJwtPayload } from '../types/auth-jwtPayload.js';
import { AuthService } from '../auth.service.js';
import { cookieExtractor } from '../../common/extractors/cookieExtractor';
import { FastifyRequest } from 'fastify';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(
    @Inject(refreshJwtConfig.KEY)
    private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: cookieExtractor('refreshToken'),
      secretOrKey: refreshJwtConfiguration.secret,
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  override validate(req: FastifyRequest, payload: AuthJwtPayload) {
    return this.authService.validateRefreshToken(payload.sub);
  }
}
