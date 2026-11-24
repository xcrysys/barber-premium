
-- ADD GUEST FIELDS TO APPOINTMENTS
-- Permite agendamentos sem login obrigatório (ou redundância de dados)

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_phone text;

-- Atualizar RLS para permitir INSERT público (para agendamento de guests)
DROP POLICY IF EXISTS "Public Insert Appointments" ON public.appointments;

CREATE POLICY "Public Insert Appointments" ON public.appointments
    FOR INSERT WITH CHECK (true);
    
-- Atualizar permissão de update (caso precise, ex: webhook de pagamento)
-- Mantemos restrito por enquanto
