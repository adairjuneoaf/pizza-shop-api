import chalk from 'chalk';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_HOST: z.string().min(1),
});

console.log(chalk.greenBright('✅ Environment variables initialized with successful!'));

export const env = envSchema.parse(process.env);
