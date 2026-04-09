process.env.JWT_SECRET = 'test-secret-for-integration-tests';
// @ts-expect-error -- Overriding NODE_ENV for test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
