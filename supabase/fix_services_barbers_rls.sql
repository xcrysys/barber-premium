
-- CORREÇÃO DE PERMISSÕES: SERVIÇOS E BARBEIROS
-- Este script libera o admin para criar, editar e excluir Serviços e Barbeiros.

-- ==============================================================================
-- 1. TABELA SERVICES (SERVIÇOS)
-- ==============================================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar duplicidade
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Public Select Services" ON public.services;
DROP POLICY IF EXISTS "Admin All Services" ON public.services;

-- Política de Leitura: Todo mundo vê (Público)
CREATE POLICY "Public Select Services" ON public.services
    FOR SELECT USING (true);

-- Política de Escrita (Insert/Update/Delete): Apenas Admin
CREATE POLICY "Admin All Services" ON public.services
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );


-- ==============================================================================
-- 2. TABELA BARBERS (BARBEIROS)
-- ==============================================================================
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "Barbers are viewable by everyone" ON public.barbers;
DROP POLICY IF EXISTS "Public Select Barbers" ON public.barbers;
DROP POLICY IF EXISTS "Admin All Barbers" ON public.barbers;

-- Política de Leitura: Todo mundo vê (Público)
CREATE POLICY "Public Select Barbers" ON public.barbers
    FOR SELECT USING (true);

-- Política de Escrita: Apenas Admin
CREATE POLICY "Admin All Barbers" ON public.barbers
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );


-- ==============================================================================
-- 3. TABELA PROFILES (PERFIS)
-- Importante: Para editar o nome/foto do barbeiro, precisamos editar o perfil dele.
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove política de update antiga se existir conflito (mas vamos adicionar uma nova para admin)
DROP POLICY IF EXISTS "Admin Update Profiles" ON public.profiles;

-- Política de Update: Admin pode editar QUALQUER perfil
CREATE POLICY "Admin Update Profiles" ON public.profiles
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- (Mantemos a política existente onde o próprio usuário edita o seu, se houver)

