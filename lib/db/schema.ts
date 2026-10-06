import { boolean, integer, index, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

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
export const pvpMatches = pgTable('pvp_matches', {
  id: text('id').primaryKey(), status: text('status').notNull().default('waiting'), playerOneId: text('player_one_id').notNull(), playerTwoId: text('player_two_id'), inviteCode: text('invite_code'), playerOneHp: integer('player_one_hp').notNull().default(100), playerTwoHp: integer('player_two_hp').notNull().default(100), createdAt: timestamp('created_at').notNull().defaultNow(), updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
export const pvpFriendships = pgTable('pvp_friendships', {
  id: text('id').primaryKey(), requesterId: text('requester_id').notNull(), addresseeId: text('addressee_id').notNull(), status: text('status').notNull().default('pending'), createdAt: timestamp('created_at').notNull().defaultNow(), updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
export const pvpInvites = pgTable('pvp_invites', {
  id: text('id').primaryKey(), matchId: text('match_id').notNull(), senderId: text('sender_id').notNull(), recipientId: text('recipient_id'), inviteCode: text('invite_code').notNull(), status: text('status').notNull().default('pending'), createdAt: timestamp('created_at').notNull().defaultNow(), expiresAt: timestamp('expires_at').notNull(),
})
export const pvpSpectators = pgTable('pvp_spectators', {
  id: text('id').primaryKey(), matchId: text('match_id').notNull(), userId: text('user_id').notNull(), createdAt: timestamp('created_at').notNull().defaultNow(),
})
export const pvpActions = pgTable('pvp_actions', {
  id: text('id').primaryKey(), matchId: text('match_id').notNull(), userId: text('user_id').notNull(), action: text('action').notNull(), seq: integer('seq').notNull(), createdAt: timestamp('created_at').notNull().defaultNow(),
})
export const pvpSeasonRewards = pgTable('pvp_season_rewards', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), season: text('season').notNull(), rewardKey: text('reward_key').notNull(), status: text('status').notNull().default('available'), claimedAt: timestamp('claimed_at'), createdAt: timestamp('created_at').notNull().defaultNow(),
})
export const pvpRatings = pgTable('pvp_ratings', {
  userId: text('user_id').primaryKey(), rating: integer('rating').notNull().default(1200), wins: integer('wins').notNull().default(0), losses: integer('losses').notNull().default(0), season: text('season').notNull().default('S1'), updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
export const pvpTeams = pgTable('pvp_teams', {
  id: text('id').primaryKey(), name: text('name').notNull(), tag: text('tag').notNull(), ownerId: text('owner_id').notNull(), createdAt: timestamp('created_at').notNull().defaultNow(),
})
export const pvpTeamMembers = pgTable('pvp_team_members', {
  id: text('id').primaryKey(), teamId: text('team_id').notNull(), userId: text('user_id').notNull(), role: text('role').notNull().default('member'), createdAt: timestamp('created_at').notNull().defaultNow(),
})
export const pvpTeamInvites = pgTable('pvp_team_invites', {
  id: text('id').primaryKey(), teamId: text('team_id').notNull(), inviterId: text('inviter_id').notNull(), inviteeId: text('invitee_id').notNull(), status: text('status').notNull().default('pending'), createdAt: timestamp('created_at').notNull().defaultNow(), expiresAt: timestamp('expires_at').notNull(),
})
export const pvpBans = pgTable('pvp_bans', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), adminId: text('admin_id').notNull(), reason: text('reason').notNull(), status: text('status').notNull().default('active'), expiresAt: timestamp('expires_at'), createdAt: timestamp('created_at').notNull().defaultNow(),
})
export const pvpRiskEvents = pgTable('pvp_risk_events', {
  id: text('id').primaryKey(), matchId: text('match_id').notNull(), userId: text('user_id').notNull(), eventType: text('event_type').notNull(), severity: text('severity').notNull().default('low'), metadata: jsonb('metadata').notNull().default({}), createdAt: timestamp('created_at').notNull().defaultNow(),
})
export const pvpReports = pgTable('pvp_reports', {
  id: text('id').primaryKey(), matchId: text('match_id').notNull(), reporterId: text('reporter_id').notNull(), reason: text('reason').notNull(), details: text('details').notNull().default(''), createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({ matchIdx: index('pvp_reports_match_idx').on(table.matchId), reporterIdx: index('pvp_reports_reporter_idx').on(table.reporterId) }))
