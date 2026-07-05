import { useState } from 'react';
import { AdminShell, type AdminTab } from '../../components/admin/AdminShell';
import { DashboardPage } from './DashboardPage';
import { AgendaPage } from './AgendaPage';
import { TratamientosPage } from './TratamientosPage';
import { PacientesPage } from './PacientesPage';

export function AdminApp() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  return (
    <AdminShell tab={tab} onTab={setTab}>
      {tab === 'dashboard' && <DashboardPage />}
      {tab === 'agenda' && <AgendaPage />}
      {tab === 'tratamientos' && <TratamientosPage />}
      {tab === 'pacientes' && <PacientesPage />}
    </AdminShell>
  );
}
