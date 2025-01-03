import dayjs from 'dayjs';
import { and, eq, gte, sql, sum } from 'drizzle-orm';
import { Elysia } from 'elysia';

import db from '../../db/connection';
import { orders } from '../../db/schema';
import { auth } from '../auth';
import { UnauthorizedError } from '../errors/unauthorized.errors';

export const getMonthRevenue = new Elysia()
  .use(auth)
  .get('/metrics/month-revenue', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const today = dayjs();
    const lastMonthStartingDayOne = today.subtract(1, 'month').startOf('month');

    const monthsRevenue = await db
      .select({
        yearMonth: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        revenue: sum(orders.totalInCents).mapWith((sum) => Number(sum)),
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

    const currentMonthRevenue = monthsRevenue.find(
      (monthRevenue) => monthRevenue.yearMonth === currentMonth,
    );
    const lastMonthRevenue = monthsRevenue.find(
      (monthRevenue) => monthRevenue.yearMonth === lastMonth,
    );

    const percentDifference =
      currentMonthRevenue && lastMonthRevenue
        ? (currentMonthRevenue.revenue * 100) / lastMonthRevenue.revenue
        : 0;

    const currentRevenue = Number(currentMonthRevenue?.revenue || 0);
    const differenceBetweenMonths = Number(
      (percentDifference - 100).toFixed(2),
    );

    return {
      content: {
        months: monthsRevenue,
        revenue: currentRevenue,
        differenceFromLastMonth: differenceBetweenMonths,
      },
    };
  });
