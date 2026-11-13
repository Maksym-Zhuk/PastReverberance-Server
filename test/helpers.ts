import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { Pool } from 'pg';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/configure-app';

export async function createApp(): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  await configureApp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

export async function resetDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(
      'TRUNCATE "users", "profileInfo", "dailyPhotos" RESTART IDENTITY CASCADE',
    );
  } finally {
    await pool.end();
  }
}

export const validUser = {
  email: 'john@example.com',
  password: 'Str0ng!Passw0rd',
  profile: { firstName: 'John', lastName: 'Doe' },
};

export function cookiesOf(res: { cookies: { name: string; value: string }[] }) {
  return res.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

export async function registerUser(
  app: NestFastifyApplication,
  overrides: Partial<typeof validUser> = {},
) {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { ...validUser, ...overrides },
  });
  if (res.statusCode !== 201) throw new Error(`register failed: ${res.body}`);
  return { cookie: cookiesOf(res), user: res.json() };
}

export function multipart(
  fields: Record<string, string>,
  file?: { name: string; type: string; content: Buffer },
) {
  const boundary = '----testboundary';
  const chunks: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`,
      ),
    );
  }
  if (file) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`,
      ),
      file.content,
      Buffer.from('\r\n'),
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    payload: Buffer.concat(chunks),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}
