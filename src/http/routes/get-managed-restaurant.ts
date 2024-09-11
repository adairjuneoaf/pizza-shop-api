import { eq } from 'drizzle-orm';
import { Elysia } from 'elysia';

import db from '../../db/connection';
import { restaurants } from '../../db/schema';
import { auth } from '../auth';

export const getRestaurantManaged = new Elysia()
  .use(auth)
  .get('/managed-restaurant', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser();

    if (!restaurantId) {
      throw new Error('User is not a manager.');
    }
    console.log('restaurantId =>> ', restaurantId);
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));

    if (!restaurant) {
      throw new Error('User is not have a restaurant.');
    }

    return { content: restaurant };
  });
