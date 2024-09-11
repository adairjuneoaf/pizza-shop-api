import Elysia, { t } from 'elysia';

import db from '../../db/connection';
import { restaurants, users } from '../../db/schema';

export const registerRestaurant = new Elysia().post(
  '/restaurants',
  async ({ body, set }) => {
    const { restaurantDescription, restaurantName, managerName, email, phone } =
      body;

    const [manager] = await db
      .insert(users)
      .values({
        name: managerName,
        email,
        phone,
        role: 'manager',
      })
      .returning({
        id: users.id,
      });

    const [result] = await db
      .insert(restaurants)
      .values({
        name: restaurantName,
        description: restaurantDescription,
        managerId: manager.id,
      })
      .returning();

    set.status = 201;

    return { content: result };
  },
  {
    body: t.Object({
      restaurantDescription: t.Optional(t.String({ maxLength: 256 })),
      restaurantName: t.String({ maxLength: 96 }),
      managerName: t.String(),
      phone: t.Optional(t.String({ maxLength: 24 })),
      email: t.String({ format: 'email' }),
    }),
  },
);
