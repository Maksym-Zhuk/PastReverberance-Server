process.env.DATABASE_URL = 'postgres://test:test@localhost:5433/test';
process.env.DATABASE_SSL = 'false';
process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_EXPIRE_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.REFRESH_JWT_EXPIRE_IN = '7d';
