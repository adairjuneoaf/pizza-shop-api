import { desc, eq, sum } from 'drizzle-orm';
import { Elysia } from 'elysia';

import db from '../../db/connection';
import { orderItems, orders, products } from '../../db/schema';
import { auth } from '../auth';
import { UnauthorizedError } from '../errors/unauthorized.errors';

export const getPopularProducts = new Elysia()
  .use(auth)
  .get('/metrics/popular-products', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const popularProducts = await db
      .select({
        product: products.name,
        amount: sum(orderItems.quantity).mapWith((sum) => Number(sum)),
        revenue: sum(orderItems.priceInCents).mapWith((sum) => Number(sum)),
      })
      .from(orderItems)
      .leftJoin(orders, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orders.restaurantId, restaurantId))
      .groupBy(products.name)
      .orderBy((fields) => desc(fields.amount))
      .limit(5);

    return {
      content: popularProducts,
    };
  });
