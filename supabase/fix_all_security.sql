
-- SOLUÇÃO COMPLETA: Cria a Função RPC E Reforça a Segurança

-- 0. Garantir RLS Ativo
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 1. APAGAR POLÍTICAS (limpeza)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Public Read Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Select All" ON public.appointments;
DROP POLICY IF EXISTS "User Select Own" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public Insert Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public Insert" ON public.appointments;
DROP POLICY IF EXISTS "Admin Update Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Delete Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin Update" ON public.appointments;

-- 2. POLÍTICAS DE ACESSO RESTRITO (Igual ao Lockdown)
-- SELECT: Apenas Admin e Dono
CREATE POLICY "Admin Select All" ON public.appointments
FOR SELECT USING ( auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') );

CREATE POLICY "User Select Own" ON public.appointments
FOR SELECT USING ( auth.uid() = customer_id );

-- INSERT: Público
CREATE POLICY "Public Insert" ON public.appointments
FOR INSERT WITH CHECK (true);

-- UPDATE/DELETE: Apenas Admin
CREATE POLICY "Admin Update" ON public.appointments
FOR UPDATE USING ( auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') );

CREATE POLICY "Admin Delete" ON public.appointments
FOR DELETE USING ( auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') );

-- 3. CRIAR A FUNÇÃO SEGURA (Crucial para a agenda funcionar!)
-- Esta função DEVE ser "SECURITY DEFINER" para ignorar o bloqueio de SELECT acima.

DROP FUNCTION IF EXISTS get_busy_slots;

CREATE OR REPLACE FUNCTION get_busy_slots(
    p_barber_id uuid,
    p_start_time timestamp with time zone,
    p_end_time timestamp with time zone
)
RETURNS TABLE (
    start_time timestamp with time zone,
    end_time timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER -- <<< ISSO É O SEGREDO: Roda como Superusuário/Criador
SET search_path = public -- Boas práticas de segurança
AS $$
    SELECT start_time, end_time
    FROM public.appointments
    WHERE barber_id = p_barber_id
    AND status IN ('confirmed', 'pending')
    AND start_time >= p_start_time
    AND end_time <= p_end_time;
$$;

-- 4. PERMISSÕES DE EXECUÇÃO
-- Garantir que o "público/anon" consiga chamar essa função
GRANT EXECUTE ON FUNCTION get_busy_slots TO public;
GRANT EXECUTE ON FUNCTION get_busy_slots TO anon;
GRANT EXECUTE ON FUNCTION get_busy_slots TO authenticated;
GRANT EXECUTE ON FUNCTION get_busy_slots TO service_role;
