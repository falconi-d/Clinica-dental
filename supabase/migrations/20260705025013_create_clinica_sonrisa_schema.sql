/*
# Clínica Sonrisa — Schema inicial

## Resumen
Crea el esquema completo de la clínica odontológica "Sonrisa" con autenticación real de Supabase,
dos roles (paciente y admin), y aislamiento de datos por paciente mediante RLS.

## Tablas nuevas
1. `profiles` — vincula a auth.users. Campos: id, nombre, correo, rol ('paciente'|'admin'),
   telefono, cedula, direccion, alergias, creado_en.
2. `tratamientos` — catálogo. Campos: id, nombre, descripcion, duracion_minutos, precio, activo, creado_en.
3. `citas` — agendamiento. Campos: id, paciente_id (FK profiles), tratamiento_id (FK tratamientos),
   fecha, hora, estado ('pendiente'|'confirmada'|'cancelada'), creado_en.
4. `horarios_bloqueados` — bloqueos manuales de admin. Campos: id, fecha, hora_inicio, hora_fin, motivo, creado_en.

## Funciones
- `is_admin()` — devuelve true si auth.uid() tiene rol='admin' en profiles. Usada por RLS.
- `handle_new_user()` — trigger AFTER INSERT en auth.users que crea automáticamente el profile
  al registrarse, tomando nombre y rol de raw_user_meta_data (con defaults 'paciente').

## Seguridad (RLS)
- profiles: SELECT/UPDATE propio o admin; INSERT solo propio (al registrarse).
- tratamientos: SELECT cualquier autenticado; INSERT/UPDATE/DELETE solo admin.
- citas: SELECT/INSERT propias o admin; UPDATE/DELETE propias con regla 24h o admin.
- horarios_bloqueados: SELECT cualquier autenticado; INSERT/UPDATE/DELETE solo admin.

## Notas
1. paciente_id en citas NO tiene DEFAULT auth.uid() porque el admin también crea citas.
2. La regla "mínimo 24h antes" se aplica en WITH CHECK de UPDATE/DELETE de citas para pacientes.
3. Email confirmation OFF.
*/

-- ============================================================
-- Tabla: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  correo text NOT NULL,
  rol text NOT NULL DEFAULT 'paciente' CHECK (rol IN ('paciente', 'admin')),
  telefono text,
  cedula text,
  direccion text,
  alergias text,
  creado_en timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Tabla: tratamientos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tratamientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  duracion_minutos int NOT NULL DEFAULT 30 CHECK (duracion_minutos > 0),
  precio numeric(10,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz DEFAULT now()
);

ALTER TABLE public.tratamientos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Tabla: citas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.citas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tratamiento_id uuid REFERENCES public.tratamientos(id) ON DELETE SET NULL,
  fecha date NOT NULL,
  hora time NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
  creado_en timestamptz DEFAULT now()
);

ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Tabla: horarios_bloqueados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.horarios_bloqueados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  motivo text,
  creado_en timestamptz DEFAULT now()
);

ALTER TABLE public.horarios_bloqueados ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Función helper: is_admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$;

-- ============================================================
-- Políticas RLS: profiles
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- ============================================================
-- Políticas RLS: tratamientos
-- ============================================================
DROP POLICY IF EXISTS "tratamientos_select_authenticated" ON public.tratamientos;
CREATE POLICY "tratamientos_select_authenticated"
ON public.tratamientos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "tratamientos_insert_admin" ON public.tratamientos;
CREATE POLICY "tratamientos_insert_admin"
ON public.tratamientos FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tratamientos_update_admin" ON public.tratamientos;
CREATE POLICY "tratamientos_update_admin"
ON public.tratamientos FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tratamientos_delete_admin" ON public.tratamientos;
CREATE POLICY "tratamientos_delete_admin"
ON public.tratamientos FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- Políticas RLS: citas
-- ============================================================
DROP POLICY IF EXISTS "citas_select_own_or_admin" ON public.citas;
CREATE POLICY "citas_select_own_or_admin"
ON public.citas FOR SELECT
TO authenticated
USING (auth.uid() = paciente_id OR public.is_admin());

DROP POLICY IF EXISTS "citas_insert_own_or_admin" ON public.citas;
CREATE POLICY "citas_insert_own_or_admin"
ON public.citas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = paciente_id OR public.is_admin());

DROP POLICY IF EXISTS "citas_update_own_or_admin" ON public.citas;
CREATE POLICY "citas_update_own_or_admin"
ON public.citas FOR UPDATE
TO authenticated
USING (
  auth.uid() = paciente_id
  OR public.is_admin()
)
WITH CHECK (
  (auth.uid() = paciente_id AND ((fecha::timestamp + hora) > (now() + interval '24 hours')))
  OR public.is_admin()
);

DROP POLICY IF EXISTS "citas_delete_own_or_admin" ON public.citas;
CREATE POLICY "citas_delete_own_or_admin"
ON public.citas FOR DELETE
TO authenticated
USING (
  (auth.uid() = paciente_id AND ((fecha::timestamp + hora) > (now() + interval '24 hours')))
  OR public.is_admin()
);

-- ============================================================
-- Políticas RLS: horarios_bloqueados
-- ============================================================
DROP POLICY IF EXISTS "horarios_select_authenticated" ON public.horarios_bloqueados;
CREATE POLICY "horarios_select_authenticated"
ON public.horarios_bloqueados FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "horarios_insert_admin" ON public.horarios_bloqueados;
CREATE POLICY "horarios_insert_admin"
ON public.horarios_bloqueados FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "horarios_update_admin" ON public.horarios_bloqueados;
CREATE POLICY "horarios_update_admin"
ON public.horarios_bloqueados FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "horarios_delete_admin" ON public.horarios_bloqueados;
CREATE POLICY "horarios_delete_admin"
ON public.horarios_bloqueados FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- Trigger: crear profile automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, correo, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'paciente')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_citas_paciente_id ON public.citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON public.citas(fecha, hora);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON public.citas(estado);
CREATE INDEX IF NOT EXISTS idx_profiles_rol ON public.profiles(rol);
CREATE INDEX IF NOT EXISTS idx_horarios_fecha ON public.horarios_bloqueados(fecha);
