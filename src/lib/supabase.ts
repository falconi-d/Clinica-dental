import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Rol = 'paciente' | 'admin';

export interface Profile {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  telefono: string | null;
  cedula: string | null;
  direccion: string | null;
  alergias: string | null;
  creado_en: string;
}

export interface Tratamiento {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
  creado_en: string;
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada';

export interface Cita {
  id: string;
  paciente_id: string;
  tratamiento_id: string | null;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  creado_en: string;
  tratamiento?: Tratamiento | null;
  paciente?: Pick<Profile, 'id' | 'nombre' | 'correo' | 'telefono' | 'cedula' | 'alergias'> | null;
}

export interface HorarioBloqueado {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string | null;
  creado_en: string;
}
