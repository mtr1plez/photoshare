import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="header-logo">
          <span className="header-logo-icon">◈</span>
          <span className="header-logo-text">UniPhoto</span>
        </Link>

        <nav className="header-nav">
          {isAdmin && !isAdminPage && (
            <Link to="/admin" className="btn btn-secondary header-admin-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <span className="desktop-only">Управление</span>
            </Link>
          )}

          {isAdminPage && (
            <Link to="/" className="btn btn-secondary">
              ← Галерея
            </Link>
          )}

          {user ? (
            <div className="header-user">
              <img
                src={user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'}
                alt=""
                className="header-avatar"
                referrerPolicy="no-referrer"
              />
              <button onClick={signOut} className="btn btn-secondary header-logout" title="Выйти">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-secondary">
              Войти
            </Link>
          )}
        </nav>
      </div>

      <style>{`
        .header {
          position: sticky;
          top: 0;
          z-index: var(--z-header);
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          color: var(--text-primary);
          font-weight: 700;
          font-size: var(--font-lg);
          letter-spacing: -0.02em;
        }

        .header-logo-icon {
          color: var(--accent);
          font-size: 1.4rem;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .header-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          border: 2px solid var(--border);
        }

        .header-logout {
          padding: var(--space-sm);
        }

        .header-admin-btn svg {
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .header-inner {
            height: 52px;
          }
          .header-logo-text {
            font-size: var(--font-md);
          }
        }
      `}</style>
    </header>
  );
}
