import { Elysia } from 'elysia';
import { Logestic } from 'logestic';

import { NotFoundError } from './errors/not-found.error';
import { authenticateFromLink } from './routes/authenticate-from-link';
import { getRestaurantManaged } from './routes/get-managed-restaurant';
import { getOrderDetails } from './routes/get-order-details';
import { getProfile } from './routes/get-profile';
import { registerRestaurant } from './routes/register-restaurant';
import { sendAuthLink } from './routes/send-auth-link';
import { signOut } from './routes/sign-out';

const app = new Elysia({ prefix: '/api' });

app
  .use(Logestic.preset('commontz'))
  .use(sendAuthLink)
  .use(authenticateFromLink)
  .use(signOut)
  .use(getProfile)
  .use(registerRestaurant)
  .use(getRestaurantManaged)
  .use(getOrderDetails)
  .error({
    NOT_FOUND: NotFoundError,
  })
  .onError(({ error, code, set }) => {
    switch (code) {
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
