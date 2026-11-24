
-- Habilita RLS na tabela (caso não esteja)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 1. Permitir LEITURA (SELECT) para TODOS (Anon e Logado)
-- Necessário para: 
-- a) O Admin ver a lista.
-- b) O Cliente "ver" quais horários estão ocupados (cálculo de disponibilidade).
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
CREATE POLICY "Enable read access for all users" ON public.appointments
FOR SELECT USING (true);

-- 2. Permitir INSERÇÃO (INSERT) para TODOS
-- Já deve existir, mas reforçando.
DROP POLICY IF EXISTS "Enable insert for all users" ON public.appointments;
CREATE POLICY "Enable insert for all users" ON public.appointments
FOR INSERT WITH CHECK (true);

-- 3. Permitir ATUALIZAÇÃO (UPDATE) para TODOS (Para o Admin confirmar/cancelar)
-- Idealmente seria só Admin, mas em Dev facilita.
DROP POLICY IF EXISTS "Enable update for all users" ON public.appointments;
CREATE POLICY "Enable update for all users" ON public.appointments
FOR UPDATE USING (true);
