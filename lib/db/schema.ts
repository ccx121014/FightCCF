import { boolean, integer, index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(), emailVerified: boolean('emailVerified').notNull().default(false), image: text('image'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(), ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull(),
})
export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), userId: text('userId').notNull(), accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt').defaultNow(), updatedAt: timestamp('updatedAt').defaultNow(),
})
export const gameProfiles = pgTable('game_profiles', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), coins: integer('coins').notNull().default(1280), gems: integer('gems').notNull().default(120), energy: integer('energy').notNull().default(5), level: integer('level').notNull().default(12), xp: integer('xp').notNull().default(2840), createdAt: timestamp('created_at').notNull().defaultNow(), updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({ userIdUnique: uniqueIndex('game_profiles_user_id_unique').on(table.userId), userIdIdx: index('game_profiles_user_id_idx').on(table.userId) }))
export const gameCharacters = pgTable('game_characters', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), name: text('name').notNull(), role: text('role').notNull(), rarity: text('rarity').notNull(), level: integer('level').notNull().default(1), power: integer('power').notNull().default(100), owned: boolean('owned').notNull().default(true), createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({ userIdIdx: index('game_characters_user_id_idx').on(table.userId) }))
export const battleRecords = pgTable('battle_records', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), result: text('result').notNull(), reward: integer('reward').notNull(), score: integer('score').notNull().default(0), createdAt: timestamp('created_at').notNull().defaultNow(),
})
