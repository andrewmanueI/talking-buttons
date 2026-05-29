import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const { error, info } = this.state;

    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#101018',
        color: '#e06c75',
        fontFamily: 'SF Mono, Consolas, monospace',
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        overflow: 'auto',
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#e06c75',
          marginBottom: 12,
        }}>
          App Crashed
        </div>

        <div style={{
          color: '#e5c07b',
          marginBottom: 16,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {error.name}: {error.message}
        </div>

        <div style={{
          color: '#5c6370',
          fontSize: 10,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Stack trace
        </div>
        <pre style={{
          color: '#abb2bf',
          fontSize: 10.5,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          margin: 0,
          marginBottom: 16,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 8,
          padding: 12,
          maxHeight: 300,
          overflow: 'auto',
        }}>
          {error.stack}
        </pre>

        {info?.componentStack && (
          <>
            <div style={{
              color: '#5c6370',
              fontSize: 10,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Component stack
            </div>
            <pre style={{
              color: '#abb2bf',
              fontSize: 10.5,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
              marginBottom: 16,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              padding: 12,
              maxHeight: 300,
              overflow: 'auto',
            }}>
              {info.componentStack}
            </pre>
          </>
        )}

        <button
          onClick={this.handleReset}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 24px',
            background: '#e06c75',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }
}
