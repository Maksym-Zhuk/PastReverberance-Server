import { relations } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { Role } from '../../common/enums/role.enum';
import { profileInfo } from './profileInfo.schema';
import { dailyPhotos } from './dailyPhotos.schema';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  role: text('role').$type<Role>().notNull().default(Role.USER),
});

export const userRelation = relations(users, ({ one, many }) => ({
  profile: one(profileInfo, {
    fields: [users.id],
    references: [profileInfo.userId],
  }),
  dailyPhotos: many(dailyPhotos),
}));
