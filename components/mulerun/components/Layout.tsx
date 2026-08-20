import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CurrencyBadge } from './CurrencyBadge';

const NAV_ITEMS = [
  { path: '/', label: '主页', icon: '🏠' },
  { path: '/levels', label: '闯关', icon: '⚔️' },
  { path: '/gacha', label: '召唤', icon: '🎴' },
  { path: '/characters', label: '角色', icon: '🥷' },
  { path: '/pvp', label: '对战', icon: '🏆' },
];

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶栏 */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(11,15,26,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/favicon.svg" width={30} height={30} alt="logo" />
          <span style={{ fontWeight: 900, fontSize: 18 }} className="grad-text">
            FightCCF
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CurrencyBadge type="gold" value={user?.currency.gold ?? 0} />
          <CurrencyBadge type="diamond" value={user?.currency.diamond ?? 0} />
          <button
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px 4px 4px',
              borderRadius: 999,
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--accent-grad)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: '#1a1206',
              }}
            >
              {user?.username?.[0]?.toUpperCase() ?? 'P'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Lv.{user?.level ?? 1}</span>
          </button>
        </div>
      </header>

      {/* 主体 */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* 底部导航 */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
          background: 'rgba(11,15,26,0.92)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border-soft)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '4px 12px',
                borderRadius: 12,
                color: active ? 'var(--accent)' : 'var(--text-mute)',
                background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
                transition: 'all 0.15s ease',
                minWidth: 56,
              }}
            >
              <span style={{ fontSize: 20, filter: active ? 'none' : 'grayscale(0.5)' }}>
                {item.icon}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
