import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error): void {
    console.error('[FightCCF] 运行时错误:', error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="center-screen">
          <div className="card" style={{ padding: 32, maxWidth: 420, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ marginBottom: 8 }}>出现了一点问题</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20 }}>
              {this.state.message || '未知错误'}
            </p>
            <button className="btn btn-primary" onClick={() => location.reload()}>
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
