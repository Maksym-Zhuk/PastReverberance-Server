import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GraphQLModule } from '@nestjs/graphql';
import { FastifyRequest, FastifyReply } from 'fastify';
import { UsersModule } from './users/users.module';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { DailyPhotosModule } from './daily-photos/daily-photos.module';

@Module({
  imports: [
    DrizzleModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
      introspection: true,
      graphiql: true,
      debug: true,
      context: (request: FastifyRequest, reply: FastifyReply) => ({
        req: request,
        reply,
      }),
    }),

    UsersModule,

    DailyPhotosModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
