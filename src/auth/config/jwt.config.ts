import { registerAs } from '@nestjs/config';

interface JwtConfig {
  secret: string;
  signOptions: {
    expiresIn?: string;
  };
}

export const jwtConfig = registerAs('jwt', (): JwtConfig => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET env variable is not set');
  }
  return {
    secret: process.env.JWT_SECRET,
    signOptions: {
      expiresIn: process.env.JWT_EXPIRE_IN,
    },
  };
});
