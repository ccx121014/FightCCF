import type { PVPTier } from '../constants/ranks';

export type PVPMode = 'ranked' | 'casual';

export interface PVPRank {
  tier: PVPTier;
  rating: number;
  stars: number;
  wins: number;
  losses: number;
  winStreak: number;
}

export interface Opponent {
  userId: string;
  username: string;
  rating: number;
  rank: PVPTier;
  characterId: string;
}

export interface Match {
  matchId: string;
  mode: PVPMode;
  opponent: Opponent;
  yourCharacterId: string;
  timeLimit: number;
  startedAt: string;
}

export interface MatchmakingEntry {
  userId: string;
  username: string;
  rating: number;
  mode: PVPMode;
  characterId: string;
  queuedAt: number;
}

export interface MatchResult {
  matchId: string;
  isWinner: boolean;
  ratingChange: number;
  duration: number;
}

export interface Tournament {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  participants: number;
  prizePool: { rank: number; rewards: string[] }[];
}

// ---- WebSocket 消息协议 ----
export type WSClientMessageType =
  | 'auth'
  | 'join_queue'
  | 'leave_queue'
  | 'player_input'
  | 'skill_used'
  | 'match_end';

export type WSServerMessageType =
  | 'auth_success'
  | 'auth_error'
  | 'queue_joined'
  | 'queue_left'
  | 'match_start'
  | 'player_input'
  | 'skill_used'
  | 'match_end'
  | 'error'
  | 'ping';

export interface WSMessage<T = unknown> {
  type: WSClientMessageType | WSServerMessageType;
  payload?: T;
}

export interface PlayerInputPayload {
  matchId: string;
  input: {
    x: number;
    y: number;
    action?: string;
  };
  timestamp: number;
}
