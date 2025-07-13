import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(fastifyCookie);
  try {
    await app.register(fastifyMultipart, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    });
  } catch (err) {
    console.error('❌ Помилка під час реєстрації fastifyMultipart:', err);
  }

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://c6j1w7gd-3000.euw.devtunnels.ms',
      'https://past-reverberance.vercel.app',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 8080, '0.0.0.0');
  console.log('Server started');
}
bootstrap();
