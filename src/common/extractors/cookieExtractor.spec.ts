import { FastifyRequest } from 'fastify';
import { cookieExtractor } from './cookieExtractor';

const req = (cookies?: Record<string, string>) =>
  ({ cookies }) as unknown as FastifyRequest;

describe('cookieExtractor', () => {
  it('returns the named cookie', () => {
    expect(cookieExtractor('a')(req({ a: 'x', b: 'y' }))).toBe('x');
  });
  it('returns null when cookie or cookies are missing', () => {
    expect(cookieExtractor('a')(req({ b: 'y' }))).toBeNull();
    expect(cookieExtractor('a')(req(undefined))).toBeNull();
  });
});
