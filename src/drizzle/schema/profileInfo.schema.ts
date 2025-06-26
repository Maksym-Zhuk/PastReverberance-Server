import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { relations } from 'drizzle-orm';

export const profileInfo = pgTable('profileInfo', {
  id: serial('id').primaryKey(),
  userId: integer('userId')
    .references(() => users.id)
    .unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  description: text('description').notNull().default(''),
  avatarUrl: text('avatarUrl').notNull().default(''),
});

export const profileInfoRelation = relations(profileInfo, ({ one }) => ({
  userId: one(users, {
    fields: [profileInfo.userId],
    references: [users.id],
  }),
}));
