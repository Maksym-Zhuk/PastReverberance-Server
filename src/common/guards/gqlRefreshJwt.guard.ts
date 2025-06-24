import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyRequest } from 'fastify';

@Injectable()
export class GqlRefreshJwtGuard extends AuthGuard('refresh-jwt') {
  getRequest(context: ExecutionContext): FastifyRequest {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext<{ req: FastifyRequest }>();
    return req;
  }
}
