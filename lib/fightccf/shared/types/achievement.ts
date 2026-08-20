import type { Reward } from './user';

export type AchievementCategory =
  | 'battle'
  | 'collection'
  | 'social'
  | 'progression'
  | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  target: number;
  reward: Reward;
  hidden?: boolean;
}

export interface UserAchievement {
  achievementId: string;
  progress: number;
  completed: boolean;
  claimedReward: boolean;
  completedAt?: string;
}
