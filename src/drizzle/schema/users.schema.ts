import { relations } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { Role } from 'src/common/enums/role.enum';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  login: text('login').notNull(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  role: text('role').$type<Role>().notNull().default(Role.USER),
});

export const userRelation = relations(users, () => ({}));
