import { z } from 'zod/v4';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  ELASTICSEARCH_URL: z.url().optional().default('http://localhost:9200'),
  ELASTICSEARCH_INDEX: z.string().optional().default('tasks'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().optional().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional().default('info'),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', JSON.stringify(result.error.issues, null, 2));
    throw new Error('Invalid environment variables');
  }
  return result.data;
}

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function env(): Env {
  if (!_env) {
    _env = loadEnv();
  }
  return _env;
}
