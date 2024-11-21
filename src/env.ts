import chalk from 'chalk';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_HOST: z.string().min(1),
  API_BASE_URL: z.string().url().min(1),
  AUTH_REDIRECT_URL: z.string().url().min(1),
  JWT_SECRET: z.string().min(24),
  AUTH_KEY_EXPIRATION_SECONDS: z
    .string()
    .transform((str) => parseInt(str))
    .pipe(z.number().min(120).max(600)),
  PAGINATION_PAGE_SIZE: z
    .string()
    .transform((str) => parseInt(str))
    .pipe(z.number().min(10).max(30)),
});

console.log(
  chalk.greenBright('✅ Environment variables initialized with successful!'),
);

export const env = envSchema.parse(process.env);
