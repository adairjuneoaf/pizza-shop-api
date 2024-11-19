import { Elysia, t } from 'elysia';

import db from '../../db/connection';
import { auth } from '../auth';
import { NotFoundError } from '../errors/not-found.error';
import { UnauthorizedError } from '../errors/unauthorized.errors';

export const getOrderDetails = new Elysia().use(auth).get(
  '/orders/:orderId',
  async ({ getCurrentUser, params }) => {
    const { orderId } = params;
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new UnauthorizedError();
    }

    const order = await db.query.orders.findFirst({
      columns: {
        id: true,
        status: true,
        totalInCents: true,
        createdAt: true,
      },
      with: {
        customer: {
          columns: {
            name: true,
            phone: true,
            email: true,
          },
        },
        orderItems: {
          columns: {
            id: true,
            quantity: true,
          },
          with: {
            product: {
              columns: {
                name: true,
                priceInCents: true,
              },
            },
          },
        },
      },
      where(fields, { eq }) {
        return eq(fields.id, orderId);
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found.');
    }

    return { content: order };
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
);
