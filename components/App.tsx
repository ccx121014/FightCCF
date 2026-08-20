import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuthStore } from './stores/authStore';
import { useCharacterStore } from './stores/characterStore';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Characters from './pages/Characters';
import Collection from './pages/Collection';
import Gacha from './pages/Gacha';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import PVP from './pages/PVP';
import LevelsPage from './pages/Levels';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';

// 战斗页懒加载
const Battle = lazy(() => import('./pages/Battle'));

function PrivateRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function BattleLoading() {
  return (
    <div className="center-screen">
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-dim)' }}>正在加载战斗...</p>
      </div>
    </div>
  );
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initCharacters = useCharacterStore((s) => s.init);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) initCharacters();
  }, [isAuthenticated, initCharacters]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 战斗页全屏，不套 Layout */}
      <Route
        path="/battle/:levelId"
        element={
          <PrivateRoute>
            <Suspense fallback={<BattleLoading />}>
              <Battle />
            </Suspense>
          </PrivateRoute>
        }
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="levels" element={<LevelsPage />} />
        <Route path="levels/:chapterId" element={<LevelsPage />} />
        <Route path="characters" element={<Characters />} />
        <Route path="collection" element={<Collection />} />
        <Route path="gacha" element={<Gacha />} />
        <Route path="shop" element={<Shop />} />
        <Route path="pvp" element={<PVP />} />
        <Route path="profile" element={<Profile />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="leaderboard" element={<Leaderboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
