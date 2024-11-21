import { and, count, desc, eq, getTableColumns, ilike, sql } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-typebox';
import { Elysia, t } from 'elysia';

import db from '../../db/connection';
import { orders, users } from '../../db/schema';
import { env } from '../../env';
import { auth } from '../auth';
import { UnauthorizedError } from '../errors/unauthorized.errors';

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getCurrentUser, query }) => {
    const { customerName, orderId, status, pageIndex } = query;
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const orderTableColumns = getTableColumns(orders);

    const baseQuery = db
      .select({ ...orderTableColumns, customerName: users.name })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.customerId))
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          orderId ? ilike(orders.id, `%${orderId}%`) : undefined,
          status ? eq(orders.status, status) : undefined,
          customerName ? ilike(users.name, `%${customerName}%`) : undefined,
        ),
      );

    const [countAllOrdersQuery, listOfAllOrderQuery] = await Promise.all([
      db.select({ count: count() }).from(baseQuery.as('baseQueryListOrders')),
      db
        .select()
        .from(baseQuery.as('baseQueryListOrders'))
        .offset(pageIndex * env.PAGINATION_PAGE_SIZE)
        .limit(env.PAGINATION_PAGE_SIZE)
        .orderBy((fields) => {
          return [
            sql`CASE ${fields.status}
              WHEN 'pending' THEN 1
              WHEN 'processing' THEN 2
              WHEN 'delivering' THEN 3
              WHEN 'delivered' THEN 4
              WHEN 'canceled' THEN 99
            END`,
            desc(fields.createdAt),
          ];
        }),
    ]);

    const totalOfOrders = countAllOrdersQuery[0].count;

    return {
      content: listOfAllOrderQuery,
      pagination: {
        pageIndex,
        perPage: env.PAGINATION_PAGE_SIZE,
        totalCount: totalOfOrders,
      },
    };
  },
  {
    query: t.Object({
      customerName: t.Optional(t.String()),
      orderId: t.Optional(t.String()),
      status: t.Optional(createSelectSchema(orders).properties.status),
      pageIndex: t.Numeric({ minimum: 0 }),
    }),
  },
);
