import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import db from '../../db/connection';
import { orders } from '../../db/schema';
import { auth } from '../auth';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import { UnauthorizedError } from '../errors/unauthorized.errors';

export const dispatchOrder = new Elysia().use(auth).patch(
  '/orders/:orderId/dispatch',
  async ({ getCurrentUser, params }) => {
    const { orderId } = params;
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const order = await db.query.orders.findFirst({
      where(fields, { eq, and }) {
        return and(
          eq(fields.id, orderId),
          eq(fields.restaurantId, restaurantId),
        );
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found.');
    }

    if (order.status !== 'processing') {
      throw new BadRequestError(
        'You can only dispatch orders with status processing.',
      );
    }

    const updatedOrder = await db
      .update(orders)
      .set({ status: 'delivering' })
      .where(eq(orders.id, orderId))
      .returning();

    return { content: updatedOrder[0] };
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
);
