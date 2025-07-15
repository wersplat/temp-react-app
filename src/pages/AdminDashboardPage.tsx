import { lazy, Suspense } from 'react';
import Tabs from '../components/ui/Tabs';
import LoadingSpinner from '../components/LoadingSpinner';

const PlayerTeamAdmin = lazy(() => import('./AdminPage'));
const DraftAdmin = lazy(() => import('./DraftAdminPage'));

const AdminDashboardPage = () => {
  const tabs = [
    { id: 'draft', label: 'Draft Admin', content: <DraftAdmin /> },
    { id: 'manage', label: 'Player & Team Admin', content: <PlayerTeamAdmin /> },
  ];

  return (
    <Suspense fallback={<LoadingSpinner className="mt-6" size="lg" />}>
      <Tabs tabs={tabs} />
    </Suspense>
  );
};

export default AdminDashboardPage;
