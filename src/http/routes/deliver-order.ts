import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

import db from '../../db/connection';
import { orders } from '../../db/schema';
import { auth } from '../auth';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';

export const deliverOrder = new Elysia().use(auth).patch(
  '/orders/:orderId/deliver',
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

    if (order.status !== 'delivering') {
      throw new BadRequestError(
        'You can only deliver orders with status delivering.',
      );
    }

    const updatedOrder = await db
      .update(orders)
      .set({ status: 'delivered' })
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
