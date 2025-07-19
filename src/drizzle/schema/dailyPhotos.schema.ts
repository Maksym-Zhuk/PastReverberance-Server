import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { relations } from 'drizzle-orm';

export const dailyPhotos = pgTable('dailyPhotos', {
  id: serial('id').primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  photoUrl: text('photoUrl').notNull(),
  photoId: text('photoId').notNull(),
  note: text('note'),
  date: text('date').notNull(),
});

export const dailyPhotosRelations = relations(dailyPhotos, ({ one }) => ({
  user: one(users, {
    fields: [dailyPhotos.userId],
    references: [users.id],
  }),
}));
