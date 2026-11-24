
-- ============================================================
-- RODAR ESTE SCRIPT NO SUPABASE SQL EDITOR
-- Resolve: agendamentos não aparecendo + perfil não salvando
-- ============================================================

-- STEP 1: Limpar TODAS as policies de appointments
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'appointments' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', r.policyname);
    END LOOP;
END $$;

-- STEP 2: Limpar TODAS as policies de profiles
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;
END $$;

-- STEP 3: Garantir RLS ativo
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- APPOINTMENTS: Políticas limpas e corretas
-- ============================================================

-- Qualquer um pode criar agendamento (guests + clientes logados)
CREATE POLICY "apt_insert" ON public.appointments
    FOR INSERT WITH CHECK (true);

-- Cliente vê seus próprios
CREATE POLICY "apt_select_own" ON public.appointments
    FOR SELECT USING (auth.uid() = customer_id);

-- Admin e barbeiro veem todos
CREATE POLICY "apt_select_staff" ON public.appointments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'barber'))
    );

-- Só admin atualiza/deleta
CREATE POLICY "apt_update_admin" ON public.appointments
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "apt_delete_admin" ON public.appointments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================================
-- PROFILES: Políticas limpas e corretas
-- ============================================================

-- Todos podem ver perfis (necessário para mostrar nome do barbeiro)
CREATE POLICY "prof_select" ON public.profiles
    FOR SELECT USING (true);

-- Usuário pode inserir seu próprio perfil
CREATE POLICY "prof_insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Usuário pode atualizar seu próprio perfil
CREATE POLICY "prof_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
