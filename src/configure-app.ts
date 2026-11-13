import { ValidationPipe } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';

export async function configureApp(app: NestFastifyApplication) {
  await app.register(fastifyCookie as never);
  await app.register(fastifyMultipart as never, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://c6j1w7gd-3000.euw.devtunnels.ms',
      'https://past-reverberance.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
