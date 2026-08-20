import { z } from 'zod';
import { APP_CONFIG } from '../constants';

// ---- 认证 ----
export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  username: z
    .string()
    .min(APP_CONFIG.minUsernameLength, `用户名至少 ${APP_CONFIG.minUsernameLength} 位`)
    .max(APP_CONFIG.maxUsernameLength, `用户名最多 ${APP_CONFIG.maxUsernameLength} 位`),
  password: z.string().min(APP_CONFIG.minPasswordLength, `密码至少 ${APP_CONFIG.minPasswordLength} 位`),
});

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

export const settingsSchema = z.object({
  notifications: z.boolean().optional(),
  sound: z.boolean().optional(),
  music: z.boolean().optional(),
  soundVolume: z.number().min(0).max(100).optional(),
  musicVolume: z.number().min(0).max(100).optional(),
  onlineStatus: z.enum(['online', 'away', 'offline']).optional(),
  allowFriendRequests: z.boolean().optional(),
  language: z.enum(['zh-CN', 'en-US']).optional(),
  theme: z.enum(['dark', 'light']).optional(),
});

// ---- 角色 ----
export const elementSchema = z.enum([
  'thunder', 'water', 'ice', 'nature', 'dark', 'fire', 'earth', 'wind', 'light',
]);
export const raritySchema = z.enum(['normal', 'rare', 'epic', 'legendary']);
export const characterTypeSchema = z.enum([
  'warrior', 'mage', 'assassin', 'support', 'tank', 'archer',
]);

// ---- 战斗 ----
export const battleResultSchema = z.object({
  levelId: z.string().min(1),
  victory: z.boolean(),
  rating: z.enum(['S', 'A', 'B', 'C']),
  timeUsed: z.number().min(0),
  maxCombo: z.number().min(0),
  totalDamage: z.number().min(0),
});

// ---- 关卡 ----
export const levelProgressSchema = z.object({
  levelId: z.string().min(1),
  stars: z.number().min(0).max(3),
  bestTime: z.number().min(0),
  bestRating: z.enum(['S', 'A', 'B', 'C']),
  completed: z.boolean(),
});

// ---- PVP ----
export const pvpModeSchema = z.enum(['ranked', 'casual']);

export const joinQueueSchema = z.object({
  userId: z.string().min(1).max(64),
  username: z.string().min(1).max(32),
  rating: z.number().min(0).max(10000),
  mode: pvpModeSchema,
  characterId: z.string().min(1).max(64),
});

export const playerInputSchema = z.object({
  matchId: z.string().startsWith('match_').max(128),
  input: z.object({
    x: z.number(),
    y: z.number(),
    action: z.string().max(32).optional(),
  }),
  timestamp: z.number(),
});

export const matchEndSchema = z.object({
  matchId: z.string().startsWith('match_').max(128),
  winnerId: z.string().min(1).max(64),
});

// ---- 抽卡 ----
export const gachaPullSchema = z.object({
  poolId: z.string().min(1),
  count: z.union([z.literal(1), z.literal(10)]),
});

// ---- 商店 ----
export const purchaseSchema = z.object({
  itemId: z.string().min(1),
  currency: z.enum(['gold', 'diamond', 'honor']),
  quantity: z.number().int().min(1).max(99).default(1),
});

// ---- 社交 ----
export const friendRequestSchema = z.object({
  targetUserId: z.string().min(1),
});

export const chatMessageSchema = z.object({
  channel: z.enum(['world', 'guild', 'private']),
  content: z.string().min(1).max(200),
});

// ---- 成就 ----
export const claimAchievementSchema = z.object({
  achievementId: z.string().min(1),
});

// ---- 通用契约 ----
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type BattleResultInput = z.infer<typeof battleResultSchema>;
