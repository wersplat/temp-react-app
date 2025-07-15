import { Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext/AuthProvider';
import { DraftProvider } from './context/DraftContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));
const DraftBoardPage = lazy(() => import('./pages/DraftBoardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading component for Suspense fallback
const PageLoading = () => (
  <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <DraftProvider>
            <div className="min-h-screen bg-gray-50">
              <Layout>
                <Suspense fallback={<PageLoading />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/teams" element={<TeamsPage />} />
                    <Route path="/teams/:teamId" element={<TeamPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/players" element={<PlayersPage />} />
                    <Route path="/draft" element={<DraftBoardPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </Layout>
            </div>
          </DraftProvider>
        </AppProvider>
        <Toaster position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
