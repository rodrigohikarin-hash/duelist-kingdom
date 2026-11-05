import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const tournaments = sqliteTable('tournaments', {
  ownerId: text('owner_id').notNull(), id: text('id').notNull(), name: text('name').notNull(),
  eventDate: text('event_date').notNull(), status: text('status').notNull(), data: text('data').notNull(),
  revision: integer('revision').notNull().default(1), updatedAt: text('updated_at').notNull(),
}, t=>[primaryKey({columns:[t.ownerId,t.id]}),index('tournaments_month_idx').on(t.ownerId,t.status,t.eventDate)]);
export const stores=sqliteTable('stores',{id:text('id').primaryKey(),owner:text('owner').notNull(),data:text('data').notNull(),revision:integer('revision').notNull().default(1)});
export const members=sqliteTable('store_members',{store:text('store').notNull(),user:text('user').notNull(),role:text('role').notNull()},t=>[primaryKey({columns:[t.store,t.user]})]);
export const invitations=sqliteTable('store_invites',{hash:text('hash').primaryKey(),store:text('store').notNull(),role:text('role').notNull(),expires:text('expires').notNull(),used:text('used')});
export const registrations=sqliteTable('registrations',{store:text('store').notNull(),event:text('event').notNull(),user:text('user').notNull(),rankingId:text('ranking_id').notNull(),name:text('name').notNull(),status:text('status').notNull(),created:text('created').notNull(),checked:text('checked'),paid:integer('paid').notNull().default(0)},t=>[primaryKey({columns:[t.store,t.event,t.user]}),index('registration_event_idx').on(t.store,t.event)]);
export const storeRecords=sqliteTable('store_records',{store:text('store').notNull(),kind:text('kind').notNull(),id:text('id').notNull(),data:text('data').notNull()},t=>[primaryKey({columns:[t.store,t.kind,t.id]})]);
export const ledger=sqliteTable('loyalty_ledger',{store:text('store').notNull(),user:text('user').notNull(),id:text('id').notNull(),points:integer('points').notNull(),description:text('description').notNull(),created:text('created').notNull()},t=>[primaryKey({columns:[t.store,t.user,t.id]})]);
