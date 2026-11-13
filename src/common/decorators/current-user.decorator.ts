import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { CurrentUser } from 'src/auth/types/current-user';

export const CurrentUserDecorator = createParamDecorator(
  (_: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<FastifyRequest & { user?: CurrentUser }>()
      .user,
);
