import dayjs from 'dayjs';
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import db from '../../db/connection';
import { orders } from '../../db/schema';
import { auth } from '../auth';
import { BadRequestError } from '../errors/bad-request.error';
import { UnauthorizedError } from '../errors/unauthorized.errors';

export const getDailyReceiptInPeriod = new Elysia().use(auth).get(
  '/metrics/daily-receipt-period',
  async ({ getCurrentUser, query }) => {
    const { to, from } = query;
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const startDate = from ? dayjs(from) : dayjs().subtract(7, 'days');
    const endDate = to ? dayjs(to) : from ? startDate.add(7, 'days') : dayjs();

    if (endDate.diff(startDate, 'days') > 7) {
      throw new BadRequestError(
        'You cannot list receipt in a larger period than 7 days.',
      );
    }

    const receiptPerDay = await db
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'DD/MM')`,
        receipt: sum(orders.totalInCents).mapWith((sum) => Number(sum)),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(
            orders.createdAt,
            startDate
              .startOf('day')
              .add(startDate.utcOffset(), 'minutes')
              .toDate(),
          ),
          lte(
            orders.createdAt,
            endDate.endOf('day').add(startDate.utcOffset(), 'minutes').toDate(),
          ),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'DD/MM')`);

    const orderedReceiptPerDay = receiptPerDay.sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map((value) => Number(value));
      const [dayB, monthB] = b.date.split('/').map((value) => Number(value));

      if (monthA === monthB) {
        return dayA - dayB;
      } else {
        const dateA = new Date(new Date().getFullYear(), monthA - 1);
        const dateB = new Date(new Date().getFullYear(), monthB - 1);

        return dateA.getTime() - dateB.getTime();
      }
    });

    return {
      content: orderedReceiptPerDay,
    };
  },
  {
    query: t.Object({
      to: t.Optional(t.String()),
      from: t.Optional(t.String()),
    }),
  },
);
