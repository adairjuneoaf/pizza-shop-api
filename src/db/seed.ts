import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import chalk from 'chalk';
import { faker } from '@faker-js/faker';
import { env } from '../env';
import * as schema from './schema';

const connection = postgres({
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  host: env.DATABASE_HOST,
  port: 5432,
});

const db = drizzle(connection, { schema });

/**
 * Reset DB
 */
await db.delete(schema.users);
await db.delete(schema.restaurants);

console.log(chalk.yellow('💾 Database reset with successful!'));

/**
 * Creating new users Customers
 */
await db.insert(schema.users).values([
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'customer',
  },
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'customer',
  }
]);

console.log(chalk.green('👥 Customers created with successful!'));

/**
 * Creating new users Manager
 */
const result = await db.insert(schema.users).values([
  {
    name: faker.person.fullName(),
    email: 'admin@admin.com',
    role: 'manager',
  },
]).returning({ id: schema.users.id });

console.log(chalk.green('🔑 Manager created with successful!'));

/**
 * Creating new Restaurant
 */
await db.insert(schema.restaurants).values([
  {
    name: faker.company.name(),
    description: faker.lorem.paragraph(2),
    managerId: result[0].id,
  }
]);

console.log(chalk.green('🍴 Restaurant created with successful!'));

console.log(chalk.greenBright('💾 Database seeded with successful!'));

process.exit();
