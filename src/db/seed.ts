import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import chalk from 'chalk';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

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
await db.delete(schema.authLinks);
await db.delete(schema.orderItems);
await db.delete(schema.orders);
await db.delete(schema.products);
await db.delete(schema.restaurants);
await db.delete(schema.users);

console.log(chalk.yellow('💾 Database reset with successful!'));

/**
 * Creating new users Customers
 */
const [customerOne, customerTwo] = await db
  .insert(schema.users)
  .values([
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
  ])
  .returning();

console.log(chalk.green('👥 Customers created with successful!'));

/**
 * Creating new users Manager
 */
const result = await db
  .insert(schema.users)
  .values([
    {
      name: faker.person.fullName(),
      email: 'admin@admin.com',
      role: 'manager',
    },
  ])
  .returning({ id: schema.users.id });

console.log(chalk.green('🔑 Manager created with successful!'));

/**
 * Creating new Restaurant
 */
const [restaurant] = await db
  .insert(schema.restaurants)
  .values([
    {
      name: faker.company.name(),
      description: faker.lorem.paragraph(2),
      managerId: result[0].id,
    },
  ])
  .returning();

console.log(chalk.green('🍴 Restaurant created with successful!'));

/**
 * Creating new Products
 */
const generateProducts = () => ({
  name: faker.commerce.productName(),
  restaurantId: restaurant.id,
  description: faker.commerce.productDescription(),
  priceInCents: Number(faker.commerce.price({ min: 170, max: 520, dec: 0 })),
});

const availableProducts = await db
  .insert(schema.products)
  .values([
    generateProducts(),
    generateProducts(),
    generateProducts(),
    generateProducts(),
    generateProducts(),
    generateProducts(),
    generateProducts(),
  ])
  .returning();

console.log(chalk.green('🍔 Products created with successful!'));

/**
 * Creating new Orders
 */

type OrdersType = typeof schema.orders.$inferInsert;
type OrderItemsType = typeof schema.orderItems.$inferInsert;

const ordersToInsertOnDB: Array<OrdersType> = [];
const orderItemsToInsertOnDB: Array<OrderItemsType> = [];

for (let index = 0; index < 250; index++) {
  const orderId = createId();

  const orderProducts = faker.helpers.arrayElements(availableProducts, {
    min: 1,
    max: 5,
  });

  let totalPriceInCents = 0;

  orderProducts.forEach((product) => {
    const quantityOfProduct = faker.number.int({ min: 1, max: 4 });
    totalPriceInCents += product.priceInCents * quantityOfProduct;

    orderItemsToInsertOnDB.push({
      orderId,
      quantity: quantityOfProduct,
      productId: product.id,
      priceInCents: product.priceInCents,
    });
  });

  ordersToInsertOnDB.push({
    id: orderId,
    customerId: faker.helpers.arrayElement([customerOne.id, customerTwo.id]),
    restaurantId: restaurant.id,
    totalInCents: totalPriceInCents,
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'delivering',
      'delivered',
      'canceled',
    ]),
    createdAt: faker.date.recent({ days: 45 }),
  });
}

await db.insert(schema.orders).values(ordersToInsertOnDB);
await db.insert(schema.orderItems).values(orderItemsToInsertOnDB);

console.log(chalk.green('✍️ Orders created with successful!'));

/**
 * End of Seed
 */
console.log(chalk.greenBright('💾 Database seeded with successful!'));

process.exit();
