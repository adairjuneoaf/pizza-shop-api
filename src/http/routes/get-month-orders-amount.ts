import dayjs from 'dayjs';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { Elysia } from 'elysia';

import db from '../../db/connection';
import { orders } from '../../db/schema';
import { auth } from '../auth';
import { UnauthorizedError } from '../errors/unauthorized.errors';

export const getMonthOrdersAmount = new Elysia()
  .use(auth)
  .get('/metrics/month-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const today = dayjs();
    const lastMonthStartingDayOne = today.subtract(1, 'month').startOf('month');

    const ordersPerMonth = await db
      .select({
        yearMonth: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, lastMonthStartingDayOne.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`);

    const currentMonth = today.format('YYYY-MM');
    const lastMonth = today.subtract(1, 'month').format('YYYY-MM');

    const currentMonthOrders = ordersPerMonth.find(
      (ordersMonth) => ordersMonth.yearMonth === currentMonth,
    );
    const lastMonthOrders = ordersPerMonth.find(
      (ordersMonth) => ordersMonth.yearMonth === lastMonth,
    );

    const percentDifference =
      currentMonthOrders && lastMonthOrders
        ? (currentMonthOrders.amount * 100) / lastMonthOrders.amount
        : 0;

    const amountCurrentMonth = Number(currentMonthOrders?.amount || 0);
    const differenceBetweenMonths = Number(
      (percentDifference - 100).toFixed(2),
    );

    return {
      content: {
        orders: ordersPerMonth,
        amount: amountCurrentMonth,
        differenceFromLastMonth: differenceBetweenMonths,
      },
    };
  });
