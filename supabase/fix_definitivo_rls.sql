
-- ============================================================
-- FIX DEFINITIVO DE RLS - AGENDAMENTOS + PERFIS
-- Rodar no Supabase SQL Editor
-- ============================================================

-- ==============================
-- APPOINTMENTS TABLE
-- ==============================
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Limpar TODAS as policies existentes para começar do zero
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable update for all users" ON public.appointments;
DROP POLICY IF EXISTS "Allow Select All Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow Update All Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public Read Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public Insert Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Update Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Delete Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Select All" ON public.appointments;
DROP POLICY IF EXISTS "User Select Own" ON public.appointments;
DROP POLICY IF EXISTS "Public Insert" ON public.appointments;
DROP POLICY IF EXISTS "Admin Update" ON public.appointments;
DROP POLICY IF EXISTS "Enable Insert for All" ON public.appointments;
DROP POLICY IF EXISTS "Customer View Own" ON public.appointments;
DROP POLICY IF EXISTS "Staff View All" ON public.appointments;

-- SELECT: Admin e Staff veem tudo, Cliente vê os seus
CREATE POLICY "appointments_select_admin" ON public.appointments
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'barber'))
    );

CREATE POLICY "appointments_select_customer" ON public.appointments
    FOR SELECT USING (auth.uid() = customer_id);

-- INSERT: Qualquer um pode criar (guests + clientes)
CREATE POLICY "appointments_insert_public" ON public.appointments
    FOR INSERT WITH CHECK (true);

-- UPDATE/DELETE: Apenas Admin
CREATE POLICY "appointments_update_admin" ON public.appointments
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "appointments_delete_admin" ON public.appointments
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- ==============================
-- PROFILES TABLE
-- ==============================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpar policies existentes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- SELECT: Público (para ver nomes de barbeiros etc)
CREATE POLICY "profiles_select_public" ON public.profiles
    FOR SELECT USING (true);

-- INSERT: Usuário pode criar o próprio perfil (necessário para trigger e cadastro)
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Usuário pode editar o próprio perfil
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
