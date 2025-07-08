import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { DrizzleModule } from 'src/drizzle/drizzle.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { UsersModule } from 'src/users/users.module';
import { jwtConfig } from './config/jwt.config';
import { refreshJwtConfig } from './config/refreshJwt.config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    DrizzleModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    UsersModule,
  ],
  providers: [AuthResolver, AuthService, JwtStrategy, RefreshJwtStrategy],
})
export class AuthModule {}
