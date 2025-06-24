import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyRequest } from 'fastify';
import { CurrentUser } from 'src/auth/types/current-user';

interface GqlContext {
  req: FastifyRequest & { user?: CurrentUser };
}

export const CurrentUserDecorator = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const gqlCtx = ctx.getContext<GqlContext>();
    return gqlCtx.req.user;
  },
);
