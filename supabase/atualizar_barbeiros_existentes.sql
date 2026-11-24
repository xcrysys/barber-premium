-- ================================================================
-- GUIA: Atualizar barbeiros existentes no Supabase
-- Execute cada bloco separadamente no SQL Editor do Supabase
-- ================================================================

-- ── PASSO 1: Ver todos os usuários e seus roles atuais ─────────
-- Execute isso primeiro para identificar quais usuários precisam
-- ser atualizados para o role 'barber'
SELECT
    p.id,
    p.full_name,
    p.role,
    u.email,
    EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = p.id) AS ja_e_barbeiro
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.role, p.full_name;


-- ── PASSO 2: Atualizar role de um usuário específico ───────────
-- Substitua 'EMAIL_DO_BARBEIRO@email.com' pelo email real
UPDATE public.profiles
SET role = 'barber'
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'EMAIL_DO_BARBEIRO@email.com'
);


-- ── PASSO 3: Criar ficha na tabela barbers (se não existir) ───
-- Necessário para aparecer na lista de barbeiros e receber agendamentos
-- Substitua 'EMAIL_DO_BARBEIRO@email.com' pelo email real
INSERT INTO public.barbers (id, bio, specialties, is_active)
SELECT
    u.id,
    'Barbeiro da equipe',
    ARRAY['Corte', 'Barba'],
    true
FROM auth.users u
WHERE u.email = 'EMAIL_DO_BARBEIRO@email.com'
  AND NOT EXISTS (SELECT 1 FROM public.barbers b WHERE b.id = u.id);


-- ── PASSO 4: Definir horários padrão (Seg-Sáb 09h-18h) ───────
-- Só execute se o barbeiro ainda não tem horários definidos
INSERT INTO public.availability (barber_id, day_of_week, start_time, end_time, break_start, break_end)
SELECT
    u.id,
    day,
    '09:00'::time,
    '18:00'::time,
    '12:00'::time,
    '13:00'::time
FROM auth.users u,
     generate_series(1, 6) AS day  -- 1=Segunda ... 6=Sábado
WHERE u.email = 'EMAIL_DO_BARBEIRO@email.com'
  AND NOT EXISTS (
      SELECT 1 FROM public.availability av
      WHERE av.barber_id = u.id AND av.day_of_week = day
  );


-- ── VERIFICAÇÃO FINAL: Confirmar que tudo está correto ─────────
SELECT
    p.full_name,
    p.role,
    u.email,
    b.is_active AS ativo_como_barbeiro,
    COUNT(av.id) AS dias_de_disponibilidade
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.barbers b ON b.id = p.id
LEFT JOIN public.availability av ON av.barber_id = p.id
WHERE p.role = 'barber'
GROUP BY p.full_name, p.role, u.email, b.is_active
ORDER BY p.full_name;


-- ── MÚLTIPLOS BARBEIROS DE UMA VEZ ────────────────────────────
-- Se quiser atualizar vários de uma vez, liste os emails:
/*
UPDATE public.profiles
SET role = 'barber'
WHERE id IN (
    SELECT id FROM auth.users
    WHERE email IN (
        'barbeiro1@email.com',
        'barbeiro2@email.com',
        'barbeiro3@email.com'
    )
);
*/
