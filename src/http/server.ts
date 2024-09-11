import { Elysia } from 'elysia';

import { authenticateFromLink } from './routes/authenticate-from-link';
import { getRestaurantManaged } from './routes/get-managed-restaurant';
import { getProfile } from './routes/get-profile';
import { registerRestaurant } from './routes/register-restaurant';
import { sendAuthLink } from './routes/send-auth-link';
import { signOut } from './routes/sign-out';

const app = new Elysia({ prefix: '/api' });

app
  .use(sendAuthLink)
  .use(authenticateFromLink)
  .use(signOut)
  .use(getProfile)
  .use(registerRestaurant)
  .use(getRestaurantManaged);

app.listen(3333, () => {
  console.log('🚀 HTTP server is running!');
});
