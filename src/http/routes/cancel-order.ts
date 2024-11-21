import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import db from '../../db/connection';
import { orders } from '../../db/schema';
import { auth } from '../auth';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';

export const cancelOrder = new Elysia().use(auth).patch(
  '/orders/:orderId/cancel',
  async ({ params }) => {
    const { orderId } = params;

    const order = await db.query.orders.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, orderId);
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found.');
    }

    if (!['pending', 'processing'].includes(order.status)) {
      throw new BadRequestError(
        'You can only cancel orders with status pending or processing.',
      );
    }

    const updatedOrder = await db
      .update(orders)
      .set({ status: 'canceled' })
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
