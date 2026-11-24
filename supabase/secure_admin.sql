
-- MELHORIA DE SEGURANÇA - RLS (Row Level Security)

-- 1. Garante que RLS está ativo
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 2. Limpa políticas antigas (permissivas demais)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable update for all users" ON public.appointments;
DROP POLICY IF EXISTS "Allow Select All Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow Update All Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public Read Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public Insert Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Update Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Delete Appointments" ON public.appointments;

-- 3. LEITURA (SELECT): Pública
-- Necessário para o sistema calcular disponibilidade (ver quais horários estão ocupados).
CREATE POLICY "Public Read Appointments" ON public.appointments
FOR SELECT USING (true);

-- 4. CRIAÇÃO (INSERT): Pública
-- Necessário para Guest Checkout (clientes não logados) e clientes logados.
CREATE POLICY "Public Insert Appointments" ON public.appointments
FOR INSERT WITH CHECK (true);

-- 5. ATUALIZAÇÃO (UPDATE): Apenas Admins
-- Restringe edição (cancelar/confirmar) apenas para usuários com role 'admin' na tabela profiles.
CREATE POLICY "Admin Update Appointments" ON public.appointments
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- 6. EXCLUSÃO (DELETE): Apenas Admins
CREATE POLICY "Admin Delete Appointments" ON public.appointments
FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- BONUS: Proteção da tabela Profiles (se ainda não tiver)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles só podem ser atualizados pelo próprio usuário ou por admin
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- Profiles são visíveis publica ou parcialmente (ajustar conforme necessidade, aqui deixamos público para ver nomes)
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles
FOR SELECT USING (true);
