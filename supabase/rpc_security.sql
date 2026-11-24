
-- 0. Garantir RLS Ativo
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 1. Trancar TUDO na tabela public.appointments
DROP POLICY IF EXISTS "Public Read Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;

-- 2. Permitir apenas ADMIN ver TODOS os agendamentos (Para o Painel)
CREATE POLICY "Admins can view all appointments" ON public.appointments
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- 3. Permitir USUÁRIO ver APENAS SEUS PRÓPRIOS agendamentos (opcional, para histórico pessoal)
CREATE POLICY "Users can view own appointments" ON public.appointments
FOR SELECT USING (
    auth.uid() = customer_id
);

-- 4. Permitir INSERÇÃO (Insert) Pública para criar agendamentos (necessário)
DROP POLICY IF EXISTS "Public Insert Appointments" ON public.appointments;
CREATE POLICY "Public insert appointments" ON public.appointments
FOR INSERT WITH CHECK (true);

-- 5. FUNCTION SEGURA: Obter Horários Ocupados (Sem expor dados sensíveis)
-- Esta função retorna APENAS start_time e end_time de agendamentos confirmados/pendentes.
-- O frontend usará isso em vez de consultar a tabela diretamente.
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
SECURITY DEFINER -- Roda com permissões de quem criou a função (bypass RLS)
AS $$
    SELECT start_time, end_time
    FROM public.appointments
    WHERE barber_id = p_barber_id
    AND status IN ('confirmed', 'pending')
    AND start_time >= p_start_time
    AND end_time <= p_end_time;
$$;
