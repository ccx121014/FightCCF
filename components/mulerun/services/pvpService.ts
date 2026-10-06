import type { WSMessage, Match, MatchResult, PVPMode } from '@shared/types';

type MessageHandler = (msg: WSMessage) => void;

// PVP WebSocket 连接管理
export class PVPService {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private token: string;
  private wsUrl: string;
  private reconnectTimer: number | null = null;

  constructor(token: string) {
    this.token = token;
    const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) || '';
    if (apiUrl) {
      this.wsUrl = apiUrl.replace(/^http/, 'ws');
    } else {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      this.wsUrl = `${proto}://${location.host}`;
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
      } catch (e) {
        reject(e);
        return;
      }

      this.ws.onopen = () => {
        this.send('auth', { token: this.token });
        resolve();
      };
      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as WSMessage;
          if (msg.type === 'ping') {
            this.ws?.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          this.handlers.forEach((h) => h(msg));
        } catch {
          /* ignore malformed */
        }
      };
      this.ws.onerror = () => reject(new Error('WebSocket 连接失败'));
      this.ws.onclose = () => {
        this.ws = null;
      };
    });
  }

  on(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send<T = unknown>(type: string, payload?: T): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  joinQueue(userId: string, username: string, rating: number, mode: PVPMode, characterId: string): void {
    this.send('join_queue', { userId, username, rating, mode, characterId });
  }

  leaveQueue(): void {
    this.send('leave_queue');
  }

  sendInput(matchId: string, x: number, y: number, action?: string): void {
    this.send('player_input', { matchId, input: { x, y, action }, timestamp: Date.now() });
  }

  endMatch(matchId: string, winnerId: string): void {
    this.send('match_end', { matchId, winnerId });
  }

  async createAuthoritativeMatch(): Promise<{ matchId: string }> {
    const response = await fetch('/api/pvp/matches', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ intent: 'create' }) });
    if (!response.ok) throw new Error('无法创建 PvP 房间');
    const data = await response.json() as { match: { id: string } };
    return { matchId: data.match.id };
  }

  async joinAuthoritativeMatch(matchId: string): Promise<void> {
    const response = await fetch('/api/pvp/matches', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ intent: 'join', matchId }) });
    if (!response.ok) throw new Error('房间已满或已开始');
  }

  async getAuthoritativeState(matchId: string): Promise<{ serverTime: number; latency: number }> {
    const startedAt = Date.now();
    const response = await fetch(`/api/pvp/matches?matchId=${encodeURIComponent(matchId)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('无法同步对局状态');
    const data = await response.json() as { serverTime: number };
    return { serverTime: data.serverTime, latency: Date.now() - startedAt };
  }

  async surrenderAuthoritativeMatch(matchId: string): Promise<void> {
    const response = await fetch('/api/pvp/matches', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ intent: 'surrender', matchId }) });
    if (!response.ok) throw new Error('投降请求失败');
  }

  async submitAuthoritativeAction(matchId: string, action: string): Promise<void> {
    const response = await fetch('/api/pvp/matches', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ intent: 'action', matchId, action }) });
    if (!response.ok) throw new Error('服务器拒绝了该操作');
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.handlers.clear();
    this.ws?.close();
    this.ws = null;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export type { Match, MatchResult };
