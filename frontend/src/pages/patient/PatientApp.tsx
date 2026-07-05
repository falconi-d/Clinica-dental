import { useState } from 'react';
import { PatientShell, type PatientTab } from '../../components/patient/PatientShell';
import { CatalogPage } from './CatalogPage';
import { SchedulePage } from './SchedulePage';
import { ConfirmPage } from './ConfirmPage';
import { MisCitasPage } from './MisCitasPage';
import { ProfilePage } from './ProfilePage';
import type { Tratamiento } from '../../lib/supabase';

type View =
  | { name: 'catalog' }
  | { name: 'schedule'; tratamiento: Tratamiento }
  | { name: 'confirm'; tratamiento: Tratamiento; fecha: string; hora: string };

export function PatientApp() {
  const [tab, setTab] = useState<PatientTab>('catalog');
  const [view, setView] = useState<View>({ name: 'catalog' });

  function handleTab(t: PatientTab) {
    setTab(t);
    if (t !== 'catalog') setView({ name: 'catalog' });
  }

  return (
    <PatientShell tab={tab} onTab={handleTab}>
      {tab === 'catalog' && view.name === 'catalog' && (
        <CatalogPage
          onAgendar={(t) => setView({ name: 'schedule', tratamiento: t })}
        />
      )}
      {tab === 'catalog' && view.name === 'schedule' && (
        <SchedulePage
          tratamiento={view.tratamiento}
          onBack={() => setView({ name: 'catalog' })}
          onConfirm={(fecha, hora) => setView({ name: 'confirm', tratamiento: view.tratamiento, fecha, hora })}
        />
      )}
      {tab === 'catalog' && view.name === 'confirm' && (
        <ConfirmPage
          tratamiento={view.tratamiento}
          fecha={view.fecha}
          hora={view.hora}
          onBack={() => setView({ name: 'schedule', tratamiento: view.tratamiento })}
          onDone={() => { setView({ name: 'catalog' }); setTab('mis-citas'); }}
        />
      )}
      {tab === 'mis-citas' && (
        <MisCitasPage onNueva={() => { setTab('catalog'); setView({ name: 'catalog' }); }} />
      )}
      {tab === 'perfil' && <ProfilePage />}
    </PatientShell>
  );
}
