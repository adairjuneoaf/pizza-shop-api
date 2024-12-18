import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';

import db from '../../db/connection';
import { users } from '../../db/schema';
import { auth } from '../auth';
import { NotFoundError } from '../errors/not-found.error';

export const getProfile = new Elysia()
  .use(auth)
  .get('/me', async ({ getCurrentUser }) => {
    const { userId } = await getCurrentUser();

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return { content: user };
  });
