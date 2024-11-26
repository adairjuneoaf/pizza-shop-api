import { Elysia } from 'elysia';
import { Logestic } from 'logestic';

import { BadRequestError } from './errors/bad-request.error';
import { NotFoundError } from './errors/not-found.error';
import { approveOrder } from './routes/approve-order';
import { authenticateFromLink } from './routes/authenticate-from-link';
import { cancelOrder } from './routes/cancel-order';
import { deliverOrder } from './routes/deliver-order';
import { dispatchOrder } from './routes/dispatch-order';
import { getDayOrdersAmount } from './routes/get-day-orders-amount';
import { getRestaurantManaged } from './routes/get-managed-restaurant';
import { getMonthOrdersAmount } from './routes/get-month-orders-amount';
import { getMonthRevenue } from './routes/get-month-revenue';
import { getOrderDetails } from './routes/get-order-details';
import { getOrders } from './routes/get-orders';
import { getProfile } from './routes/get-profile';
import { registerRestaurant } from './routes/register-restaurant';
import { sendAuthLink } from './routes/send-auth-link';
import { signOut } from './routes/sign-out';

const app = new Elysia({ prefix: '/api' });

app
  .headers({ 'content-type': 'application/json' })
  .use(Logestic.preset('commontz'))
  .use(sendAuthLink)
  .use(authenticateFromLink)
  .use(signOut)
  .use(getProfile)
  .use(registerRestaurant)
  .use(getRestaurantManaged)
  .use(getOrders)
  .use(getOrderDetails)
  .use(approveOrder)
  .use(cancelOrder)
  .use(deliverOrder)
  .use(dispatchOrder)
  .use(getMonthRevenue)
  .use(getDayOrdersAmount)
  .use(getMonthOrdersAmount)
  .error({
    NOT_FOUND: NotFoundError,
    BAD_REQUEST: BadRequestError,
  })
  .onError(({ error, code, set }) => {
    switch (code) {
      case 'BAD_REQUEST':
        set.status = 400;
        return { code, message: error.message };
      case 'NOT_FOUND':
        set.status = 404;
        return { code, message: error.message };
      case 'VALIDATION':
        set.status = error.status;
        return error.toResponse();
      default: {
        set.status = 500;
        console.error(error);
        return new Response(null, { status: 500 });
      }
    }
  });

app.listen(3333, () => {
  console.log('🚀 HTTP server is running!');
});
