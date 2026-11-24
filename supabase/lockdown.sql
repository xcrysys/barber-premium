
-- TENTATIVA FINAL E ABSOLUTA DE BLOQUEIO DE LEITURA

-- 0. Garantir RLS Ativo
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 1. APAGAR TODAS AS POLÍTICAS ANTIGAS (Limpeza Total)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Public Read Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public select availability" ON public.appointments;
DROP POLICY IF EXISTS "Public Insert Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Update Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Delete Appointments" ON public.appointments;

-- 2. BLOQUEAR TUDO (DEFAULT DO RLS É BLOCK SE NÃO HOUVER POLICY)
-- Neste ponto, NINGUÉM consegue ler nada.

-- 3. PERMITIR APENAS ADMIN LER (SELECT)
CREATE POLICY "Admin Select All" ON public.appointments
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- 4. PERMITIR USUÁRIO LOGADO LER OS DELE (SELECT) (Opcional, mas boa prática)
CREATE POLICY "User Select Own" ON public.appointments
FOR SELECT USING (
    auth.uid() = customer_id
);

-- 5. PERMITIR QUALQUER UM CRIAR AGENDAMENTO (INSERT)
-- Sem isso, ninguém consegue agendar.
CREATE POLICY "Public Insert" ON public.appointments
FOR INSERT WITH CHECK (true);

-- 6. PERMITIR ATUALIZAR (UPDATE) APENAS ADMIN
CREATE POLICY "Admin Update" ON public.appointments
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);
