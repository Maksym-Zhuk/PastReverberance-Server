import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { relations } from 'drizzle-orm';

export const dailyPhotos = pgTable('dailyPhotos', {
  id: serial('id').primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  photoUrl: text('photoUrl').notNull(),
  note: text('note'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dailyPhotosRelations = relations(dailyPhotos, ({ one }) => ({
  user: one(users, {
    fields: [dailyPhotos.userId],
    references: [users.id],
  }),
}));
