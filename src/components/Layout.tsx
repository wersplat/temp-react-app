import { memo, useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext/useAuth';
import { useToast } from '../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

type NavItem = {
  name: string;
  path: string;
  isActive: boolean;
  isAdminOnly?: boolean;
  requiresAuth?: boolean;
  icon?: React.ReactNode;
};

// Simple toast function as fallback
const fallbackToast = {
  toast: (message: string) => {
    console.log('Toast:', message);
  }
};

// Animation variants for the mobile menu
const mobileMenuVariants = {
  hidden: { opacity: 0, x: '100%' },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: 'tween' as const,
      ease: 'easeOut' as const,
      duration: 0.2
    }
  },
  exit: { 
    opacity: 0, 
    x: '100%',
    transition: { 
      type: 'tween' as const,
      ease: 'easeIn' as const,
      duration: 0.15
    }
  }
};

const Layout = memo(({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast() || fallbackToast;
  const isAdmin = user?.email?.endsWith('@admin.com') ?? false;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('#user-menu-button') && !target.closest('.user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);
  // Track scroll position for header styling
  const [, setScrolled] = useState(false);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);
  
  // Add scroll listener for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = useMemo<NavItem[]>(
    () => [
      { 
        name: 'Home', 
        path: '/', 
        isActive: location.pathname === '/',
        icon: <HomeIcon className="w-5 h-5" />
      },
      { 
        name: 'Team', 
        path: '/team', 
        isActive: location.pathname === '/team',
        icon: <UserGroupIcon className="w-5 h-5" />
      },
      {
        name: 'Messages',
        path: '/messages',
        isActive: location.pathname.startsWith('/messages'),
        icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />
      },
      {
        name: 'Favorites',
        path: '/favorites',
        isActive: location.pathname.startsWith('/favorites'),
        icon: <StarIcon className="w-5 h-5" />
      },
      {
        name: 'Admin',
        path: '/admin',
        isActive: location.pathname.startsWith('/admin'),
        isAdminOnly: true,
        icon: <ShieldCheckIcon className="w-5 h-5" />
      },
    ],
    [location.pathname]
  );

  const filteredNavItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          !item.requiresAuth ||
          (item.requiresAuth && user && !(item.isAdminOnly && !isAdmin))
      ),
    [navItems, user, isAdmin]
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

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Desktop Auth Section */}
            <div className="hidden items-center space-x-3 sm:flex">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <button 
                      className="flex items-center space-x-1 rounded-full p-1 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white"
                      onClick={() => setMobileOpen(!mobileOpen)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-gray-500 transition-transform group-hover:rotate-180" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="invisible absolute right-0 mt-2 w-48 origin-top-right scale-95 rounded-lg bg-white py-1 opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-200 group-hover:visible group-hover:scale-100 group-hover:opacity-100 dark:bg-gray-800 dark:ring-white/10">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{user.email}</div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                        >
                          <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5 text-gray-500" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    to="/login"
                    className="btn btn-ghost"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
              
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
              </button>
              
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={() => document.documentElement.classList.toggle('dark')}
                aria-label="Toggle dark mode"
              >
                <MoonIcon className="h-5 w-5 block dark:hidden" />
                <SunIcon className="h-5 w-5 hidden dark:block" />
              </button>
              
              <div className="hidden sm:ml-4 sm:flex sm:items-center">
                <div className="relative">
                  <button
                    type="button"
                    className="flex rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    id="user-menu-button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <UserCircleIcon className="h-8 w-8 rounded-full bg-gray-200 text-gray-500" />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {user?.email?.split('@')[0] || 'User'}
                    </span>
                  </button>
                  
                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                        tabIndex={-1}
                      >
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email?.split('@')[0] || 'User'}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          role="menuitem"
                          tabIndex={-1}
                        >
                          <UserCircleIcon className="mr-2 h-5 w-5" />
                          Your Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          role="menuitem"
                          tabIndex={-1}
                        >
                          <Cog6ToothIcon className="mr-2 h-5 w-5" />
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                          role="menuitem"
                          tabIndex={-1}
                        >
                          <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:hidden"
              >
                <span className="sr-only">Open main menu</span>
                {mobileOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="fixed inset-0 z-40 h-screen w-full bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 sm:hidden"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileMenuVariants}
            >
              <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
                <Link
                  to="/"
                  className="text-xl font-bold text-gray-900 dark:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                    Fantasy Draft
                  </span>
                </Link>
                <button
                  type="button"
                  className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="px-4 py-3">
                <nav className="hidden sm:flex space-x-2">
                  {filteredNavItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        item.isActive
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-100'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {item.icon}
                      <span className="ml-2">{item.name}</span>
                    </Link>
                  ))}
                </nav>
                
                {user ? (
                  <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <div className="flex items-center px-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileOpen(false);
                        }}
                        className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <Link
                      to="/login"
                      className="block w-full rounded-lg bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                      onClick={() => setMobileOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-700"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Draft App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;