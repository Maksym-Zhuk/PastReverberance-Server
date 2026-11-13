import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE } from 'src/drizzle/drizzle.token';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { ConfigType } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { CurrentUser } from './types/current-user';
import { RegisterInput } from './dto/register.dto';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import * as bcrypt from 'bcrypt';
import { users } from 'src/drizzle/schema/users.schema';
import { LoginInput } from './dto/login.dto';
import { profileInfo } from 'src/drizzle/schema/profileInfo.schema';
import { refreshJwtConfig } from './config/refreshJwt.config';
<<<<<<< Updated upstream
=======
import { omitPassword } from 'src/common/omit-password';
import { isUniqueViolation } from 'src/common/is-unique-violation';
>>>>>>> Stashed changes

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
  ) {}

  private async generateTokens(userId: number) {
    const payload: AuthJwtPayload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.refreshTokenConfig.secret,
        ...this.refreshTokenConfig.signOptions,
      }),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async register(input: RegisterInput) {
    const hashedPassword: string = await bcrypt.hash(input.password, 10);
    const { firstName, lastName, description = '' } = input.profile;
    // user + profile are created atomically: no orphan user if profile fails
    const userId = await this.db
      .transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({ email: input.email, password: hashedPassword })
          .returning({ id: users.id });
        await tx
          .insert(profileInfo)
          .values({ userId: created.id, firstName, lastName, description });
        return created.id;
      })
      .catch((e: unknown) => {
        if (isUniqueViolation(e))
          throw new ConflictException('Email already in use');
        throw e;
      });

<<<<<<< Updated upstream
    const userId = user[0]?.id;
    if (!userId) throw new Error('User ID is undefined');

    if (!input.profile) {
      throw new UnauthorizedException('Profile data missing!');
    }

    const profile = await this.createProfile(userId, input.profile);
    if (!profile) throw new UnauthorizedException('Profile not created');

    const { accessToken, refreshToken } = await this.generateTokens(user[0].id);
=======
    const { accessToken, refreshToken } = await this.generateTokens(userId);
>>>>>>> Stashed changes
    if (!accessToken && !refreshToken)
      throw new UnauthorizedException('Tokens not created');

    const userWithProfile = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, userId),
      with: {
        profile: true,
      },
    });

    return { accessToken, refreshToken, user: userWithProfile };
  }

  async login(input: LoginInput) {
    const user = await this.db.query.users.findFirst({
      where: (users) => eq(users.email, input.email),
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');
    const checkPassword = await bcrypt.compare(input.password, user?.password);
    if (!checkPassword)
      throw new UnauthorizedException('Invalid email or password');
    const { accessToken, refreshToken } = await this.generateTokens(user.id);
    if (!accessToken && !refreshToken)
      throw new UnauthorizedException('Tokens not created');
    return { accessToken, refreshToken, user };
  }

  async validateJwtUser(userId: number) {
    const user = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, userId),
    });
    if (!user) throw new UnauthorizedException('User not found!');
    const currentUser: CurrentUser = { id: user.id, role: user.role };
    return currentUser;
  }

  async validateRefreshToken(userId: number) {
    const user = await this.db.query.users.findFirst({
      where: (users) => eq(users.id, userId),
    });
    if (!user) throw new UnauthorizedException('User not found!');
    const accessToken = await this.jwtService.signAsync({ sub: userId });
    return { accessToken };
  }
}
