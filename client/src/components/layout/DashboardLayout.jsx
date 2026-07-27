import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * DashboardLayout — light, data-dense layout for owner and admin.
 * Section 7: steel background, KPI cards across top, data-heavy.
 */
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  const navItems = isAdmin
    ? [{ to: '/admin', label: 'Dashboard' }]
    : [
        { to: '/owner/dashboard', label: 'Dashboard' },
        { to: '/owner/menu', label: 'Menu' },
        { to: '/owner/orders', label: 'Orders' },
        { to: '/owner/analytics', label: 'Analytics' },
      ];

  return (
    <div className="min-h-screen bg-steel">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-16 bg-ink flex flex-col items-center py-6 z-50">
        <div className="font-display text-surface text-lg font-bold mb-8">S</div>
        <nav className="flex flex-col gap-4 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `w-10 h-10 rounded-sm flex items-center justify-center text-xs font-body font-medium transition-colors ${
                  isActive
                    ? 'bg-surface/15 text-surface'
                    : 'text-surface/50 hover:text-surface hover:bg-surface/10'
                }`
              }
              title={item.label}
            >
              {item.label.charAt(0)}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-10 h-10 text-surface/50 hover:text-surface text-xs transition-colors"
          title="Log out"
        >
          ✕
        </button>
      </aside>

      {/* Main content area */}
      <div className="ml-16">
        <header className="bg-surface border-b border-rail/10 px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-ink">
            {isAdmin ? 'Admin Panel' : `${user?.name || 'Owner'}'s Dashboard`}
          </h1>
          <span className="text-sm text-rail font-body">{user?.email}</span>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
