// API 基础封装：统一注入 token 与 x-user-id，处理错误
import type { APIResponse } from '@shared/types';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('fightccf_auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
}

function getUserId(): string | null {
  try {
    const raw = localStorage.getItem('fightccf_auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.user?.id ?? null;
  } catch {
    return null;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  timeout?: number;
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<APIResponse<T>> {
  const { method = 'GET', body, auth = true, timeout = 12000 } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const uid = getUserId();
    if (uid) headers['x-user-id'] = uid;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = (await res.json().catch(() => ({}))) as APIResponse<T>;
    if (!res.ok) {
      return { success: false, error: data.error || `请求失败 (${res.status})` };
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error && err.name === 'AbortError' ? '请求超时' : '网络错误';
    return { success: false, error: msg };
  }
}

export const API_BASE = API_URL;
export const isOfflineMode = !API_URL;
