import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { StickAvatar } from '@/components/StickAvatar';
import { APP_CONFIG } from '@shared/constants';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (username.length < APP_CONFIG.minUsernameLength) {
      setLocalError(`用户名至少 ${APP_CONFIG.minUsernameLength} 位`);
      return;
    }
    if (password.length < APP_CONFIG.minPasswordLength) {
      setLocalError(`密码至少 ${APP_CONFIG.minPasswordLength} 位`);
      return;
    }

    try {
      await register(email, username, password);
      navigate('/', { replace: true });
    } catch {
      /* error 已存入 store */
    }
  }

  return (
    <div className="center-screen">
      <div className="card anim-in" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <StickAvatar color="#f43f5e" element="dark" size={64} pose="attack" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900 }} className="grad-text">
            创建账号
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
            加入算法格斗的世界
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>邮箱</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>用户名</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder={`${APP_CONFIG.minUsernameLength}-${APP_CONFIG.maxUsernameLength} 位`} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>密码</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`至少 ${APP_CONFIG.minPasswordLength} 位`} style={inputStyle} />
          </div>

          {(localError || error) && (
            <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600 }}>{localError || error}</div>
          )}

          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: 4, height: 46 }}>
            {isLoading ? '注册中...' : '注 册'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-dim)' }}>
          已有账号？{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-dim)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--bg-2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: 15,
  outline: 'none',
};
