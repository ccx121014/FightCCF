// 通用类型 + 汇总导出
export * from './user';
export * from './character';
export * from './battle';
export * from './level';
export * from './pvp';
export * from './gacha';
export * from './shop';
export * from './social';
export * from './achievement';

export type Language = 'zh-CN' | 'en-US';
export type GameRegion = 'cn' | 'global';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Entity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}
