import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { DraftProvider } from './context/DraftContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeamPage from './pages/TeamPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DraftProvider>
          <div className="min-h-screen bg-gray-50">
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/teams/:teamId" element={<TeamPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
            <Toaster position="bottom-right" />
          </div>
        </DraftProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
