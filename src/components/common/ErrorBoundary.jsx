import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => reg.unregister());
        });
      }
    } catch (_) {}
    window.location.href = window.location.origin + '?reload=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Prompt, sans-serif',
          background: '#fdfafb',
          color: '#334155'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '2.5rem 2rem',
            borderRadius: '20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            maxWidth: '460px',
            width: '100%',
            border: '1px solid #fce7f3'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌸</div>
            <h2 style={{ color: '#9c3858', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
              สุขใจวัยเกษียณทัวร์
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              มีเวอร์ชันปรับปรุงใหม่หรือข้อมูลการแสดงผลถูกอัปเดต กรุณากดปุ่มด้านล่างเพื่อโหลดหน้าเว็บใหม่อัตโนมัติครับ
            </p>
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '0.85rem 1.5rem',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #9c3858, #b84368)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(156, 56, 88, 0.25)'
              }}
            >
              🔄 รีเฟรชโหลดหน้าเว็บใหม่
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
