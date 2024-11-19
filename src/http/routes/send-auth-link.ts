import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import Elysia, { t } from 'elysia';

import db from '../../db/connection';
import { authLinks, users } from '../../db/schema';
import { env } from '../../env';
import { NotFoundError } from '../errors/not-found.error';

export const sendAuthLink = new Elysia().post(
  '/authenticate',
  async ({ body, set }) => {
    const { email } = body;

    const [userFromEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!userFromEmail) {
      throw new NotFoundError('User not found');
    }

    const authLinkCode = createId();

    await db.insert(authLinks).values({
      userId: userFromEmail.id,
      code: authLinkCode,
    });

    // Enviar e-mail

    const authUrl = new URL('api/auth-links/authenticate', env.API_BASE_URL);
    authUrl.searchParams.set('code', authLinkCode);
    authUrl.searchParams.set('redirect', env.AUTH_REDIRECT_URL);

    set.status = 'Created';
    return { content: authUrl.toString() };
  },
  {
    body: t.Object({
      email: t.String({
        format: 'email',
        error: 'Must be a valid email.',
      }),
    }),
  },
);
