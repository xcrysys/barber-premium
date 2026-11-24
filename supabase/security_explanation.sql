
-- REAJUSTE DE SEGURANÇA - RLS (Row Level Security)

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 1. Limpa todas as políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Public Read Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public select availability" ON public.appointments;

-- 2. LEITURA (SELECT): Híbrida
-- Usuários Normais/Anon: Só veem Horário Inicio/Fim (para calcular disponibilidade)
-- Admins: Veem TUDO (detalhes do cliente, valor, notas)

-- Como o Supabase não suporta "Column Level Security" nativo fácil no RLS,
-- a estratégia comum é ter tudo privado e usar uma Function/View "security definer" para disponibilidade,
-- OU, se simplificarmos: deixamos SELECT aberto (para o app funcionar) mas confiamos que o Frontend não mostra dados sensíveis,
-- E apenas o Admin consegue UPDATE/DELETE.

-- POREM, você quer que "sem estar logado NÃO consiga ver lista de agendamentos".
-- O problema é: O sistema PRECISA ler os agendamentos para saber que "14:00 está ocupado".
-- Se bloquearmos o SELECT, a agenda vai parecer 100% livre para quem não é admin.

-- SOLUÇÃO:
-- Manter SELECT aberto para todos (necessário para disponibilidade),
-- MAS criar uma View ou Função RPC segura para o Painel Admin?
-- Ou aceitar que o SELECT é técnico (API) e o Frontend decide o que mostrar.

-- SE você quer bloquear o acesso à TABELA "appointments" via API direta:
-- Teremos que criar uma função RPC `get_availability(date)` que retorna apenas horários ocupados sem detalhes pessoais.
-- E fechar o SELECT da tabela appointments apenas para Admins ou Donos do agendamento.

-- Vamos implementar essa abordagem mais segura:

-- A) Bloquear SELECT geral na tabela appointments
DROP POLICY IF EXISTS "Public Read Appointments" ON public.appointments;

CREATE POLICY "Admins view all" ON public.appointments
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Users view own" ON public.appointments
FOR SELECT USING (
    auth.uid() = customer_id
);

-- B) Permitir INSERT público (para agendar)
CREATE POLICY "Public Insert" ON public.appointments
FOR INSERT WITH CHECK (true);

-- C) Permitir UPDATE apenas Admin
CREATE POLICY "Admin Update" ON public.appointments
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- AGORA: O sistema de agendamento vai QUEBRAR se não fizermos uma função segura para checar disponibilidade.
-- O `getBarberAvailability` no `db.ts` faz um SELECT na tabela appointments. Se fecharmos o SELECT, ele falha.
-- Precisamos liberar SELECT apenas de colunas "start_time, end_time, barber_id" para o público? O RLS não filtra colunas.

-- SOLUÇÃO PRAGMÁTICA (que resolve seu problema visual):
-- Deixe o RLS aberto para SELECT (para o `db.ts` funcionar no front), 
-- MAS implemente a checagem no `page.tsx` do Admin (já fizemos com `AdminAuthCheck`).

-- SE VOCÊ QUER SEGURANÇA TOTAL DE DADOS (ninguém captura os dados via API):
-- Você precisa migrar a lógica de `getBarberAvailability` para uma PostgreSQL Function (RPC).
