import dayjs from 'dayjs';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { Elysia } from 'elysia';

import db from '../../db/connection';
import { orders } from '../../db/schema';
import { auth } from '../auth';
import { UnauthorizedError } from '../errors/unauthorized.errors';

export const getDayOrdersAmount = new Elysia()
  .use(auth)
  .get('/metrics/day-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const today = dayjs();
    const yesterday = today.subtract(1, 'day').startOf('day');

    const ordersPerDay = await db
      .select({
        day: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, yesterday.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

    const todayFormatted = today.format('YYYY-MM-DD');
    const yesterdayFormatted = yesterday.format('YYYY-MM-DD');

    const currentDayAmount = ordersPerDay.find(
      (dayAmount) => dayAmount.day === todayFormatted,
    );
    const yesterdayAmount = ordersPerDay.find(
      (dayAmount) => dayAmount.day === yesterdayFormatted,
    );

    const percentDifference =
      currentDayAmount && yesterdayAmount
        ? (currentDayAmount.amount * 100) / yesterdayAmount.amount
        : 0;

    const amountToday = Number(currentDayAmount?.amount || 0);
    const differenceBetweenDays = Number(percentDifference.toFixed(2));

    return {
      content: {
        days: ordersPerDay,
        amount: amountToday,
        differenceFromYesterday: differenceBetweenDays,
      },
    };
  });
