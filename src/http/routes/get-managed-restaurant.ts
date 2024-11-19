import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';

import db from '../../db/connection';
import { restaurants } from '../../db/schema';
import { auth } from '../auth';
import { NotFoundError } from '../errors/not-found.error';

export const getRestaurantManaged = new Elysia()
  .use(auth)
  .get('/managed-restaurant', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new NotFoundError('User is not a manager.');
    }
    console.log('restaurantId =>> ', restaurantId);
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));

    if (!restaurant) {
      throw new NotFoundError('User is not have a restaurant.');
    }

    return { content: restaurant };
  });
