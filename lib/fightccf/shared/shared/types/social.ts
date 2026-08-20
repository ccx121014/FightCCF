import type { Profile } from './user';

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface Friend {
  id: string;
  profile: Profile;
  status: FriendStatus;
  onlineStatus: 'online' | 'away' | 'offline';
  addedAt: string;
}

export interface GuildMember {
  userId: string;
  username: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  joinedAt: string;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  level: number;
  exp: number;
  memberCount: number;
  maxMembers: number;
  members: GuildMember[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channel: 'world' | 'guild' | 'private';
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}
