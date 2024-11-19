import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';
import { Elysia, NotFoundError, t } from 'elysia';

import db from '../../db/connection';
import { authLinks, restaurants } from '../../db/schema';
import { env } from '../../env';
import { auth } from '../auth';

export const authenticateFromLink = new Elysia().use(auth).get(
  '/auth-links/authenticate',
  async ({ jwt, query, cookie, redirect }) => {
    const { code, redirect: urlToRedirect } = query;
    const { sign } = jwt;

    const [authLinkFromCode] = await db
      .select()
      .from(authLinks)
      .where(eq(authLinks.code, code));

    if (!authLinkFromCode) {
      throw new NotFoundError('Auth link not found.');
    }

    const authLinksIsExpired =
      dayjs().diff(authLinkFromCode.createdAt, 'seconds') >=
      env.AUTH_KEY_EXPIRATION_SECONDS;

    if (authLinksIsExpired) {
      throw new NotFoundError(
        'Auth link is expired, please generate a new one.',
      );
    }

    const [managerRestaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.managerId, authLinkFromCode.userId));

    const token = await sign({
      sub: authLinkFromCode.userId,
      restaurantId: managerRestaurant?.id,
    });

    cookie.auth.set({
      path: '/',
      value: token,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 3, // 3 Days
    });

    await db.delete(authLinks).where(eq(authLinks.code, code));

    return redirect(urlToRedirect, 307);
  },
  {
    query: t.Object({
      code: t.String(),
      redirect: t.String(),
    }),
  },
);
