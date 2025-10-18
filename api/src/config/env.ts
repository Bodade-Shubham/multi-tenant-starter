import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z
    .string()
    .min(1, 'MONGO_URI is required'),
  MONGO_DB_NAME: z.string().min(1, 'MONGO_DB_NAME is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_TTL: z.string().min(1, 'JWT_ACCESS_TTL is required'),
  JWT_REFRESH_TTL: z.string().min(1, 'JWT_REFRESH_TTL is required')
});

type EnvSchema = z.infer<typeof envSchema>;

let cachedEnv: EnvSchema | null = null;

export const loadEnv = (): EnvSchema => {
  if (cachedEnv) {
    return cachedEnv;
  }

  loadDotenv();

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formattedErrors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid environment configuration: ${formattedErrors}`);
  }

  cachedEnv = parsed.data;
  return parsed.data;
};

export const env = loadEnv();
