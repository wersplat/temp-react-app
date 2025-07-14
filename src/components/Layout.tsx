import { memo, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext/useAuth';
import { useToast } from '../hooks/useToast';
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type NavItem = {
  name: string;
  path: string;
  isActive: boolean;
  isAdminOnly?: boolean;
  requiresAuth?: boolean;
};

// Simple toast function as fallback
const fallbackToast = {
  toast: (message: string) => {
    console.log('Toast:', message);
  }
};

const Layout = memo(({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast() || fallbackToast;
  const isAdmin = user?.email?.endsWith('@admin.com') ?? false;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        name: 'Draft Board',
        path: '/',
        isActive: location.pathname === '/',
      },
      {
        name: 'My Team',
        path: user ? `/teams/${user.id}` : '/login',
        isActive: location.pathname.startsWith('/teams/'),
        requiresAuth: true,
      },
      {
        name: 'Admin',
        path: '/admin',
        isActive: location.pathname === '/admin',
        isAdminOnly: true,
        requiresAuth: true,
      },
    ],
    [location.pathname, user?.id]
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      toast('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast('Error signing out: ' + (error instanceof Error ? error.message : 'Please try again'));
    }
  };

  const filteredNavItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          !item.requiresAuth ||
          (item.requiresAuth && user && !(item.isAdminOnly && !isAdmin))
      ),
    [navItems, user, isAdmin]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-brand-blue-600">🏀 Draft App</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-700 hover:text-indigo-600 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            <nav className="hidden md:flex items-center space-x-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.isActive
                      ? 'bg-brand-blue-50 text-brand-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden md:inline text-sm font-medium text-gray-700">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-brand-red-600 hover:text-brand-red-800 transition-colors"
                    aria-label="Sign out"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-1" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-800 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation menu */}
        <div
          className={`md:hidden absolute top-full inset-x-0 bg-white shadow-md transform transition-transform duration-300 ${mobileOpen ? 'translate-y-0' : '-translate-y-full'}`}
        >
          <div className="px-4 pt-2 pb-4 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${item.isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Draft App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;