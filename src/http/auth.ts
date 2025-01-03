import { cookie } from '@elysiajs/cookie';
import { jwt } from '@elysiajs/jwt';
import { Elysia, t } from 'elysia';

import { env } from '../env';
import { UnauthorizedError } from './errors/unauthorized.errors';

export const auth = new Elysia()
  .error({
    UNAUTHORIZED: UnauthorizedError,
  })
  .onError(({ error, code, set }) => {
    switch (code) {
      case 'UNAUTHORIZED':
        set.status = 401;
        return { code, message: error.message };
    }
  })
  .use(
    jwt({
      secret: env.JWT_SECRET,
      schema: t.Object({
        sub: t.String(),
        restaurantId: t.Optional(t.String()),
      }),
    }),
  )
  .use(cookie())
  .derive(({ jwt, cookie }) => {
    return {
      getCurrentUser: async () => {
        const authCookie = cookie.auth;

        const payload = await jwt.verify(authCookie.value);

        if (!payload) {
          throw new UnauthorizedError();
        }

        return {
          userId: payload.sub,
          restaurantId: payload.restaurantId,
        };
      },
    };
  })
  .as('global');
