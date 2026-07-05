import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/ui/Toast';
import { FullScreenSpinner } from './components/ui/Spinner';
import { AuthPage } from './pages/AuthPage';
import { PatientApp } from './pages/patient/PatientApp';
import { AdminApp } from './pages/admin/AdminApp';

function Router() {
  const { session, profile, loading, rol } = useAuth();

  if (loading) return <FullScreenSpinner label="Cargando Sonrisa…" />;

  if (!session || !profile) return <AuthPage />;

  if (rol === 'admin') return <AdminApp />;
  return <PatientApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </AuthProvider>
  );
}
