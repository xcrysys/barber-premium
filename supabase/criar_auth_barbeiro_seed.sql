-- ================================================================
-- CRIAR CONTA DE LOGIN para barbeiro que existe só no banco (seed)
-- Ou seja: tem registro em profiles/barbers mas NÃO tem auth.users
-- Execute PASSO A PASSO no SQL Editor do Supabase
-- ================================================================

-- ── PASSO 1: Confirmar que o barbeiro existe no banco ──────────
-- Rode isso para ver o UUID do perfil do Gabriel
SELECT
    p.id,
    p.full_name,
    p.role,
    b.is_active
FROM public.profiles p
LEFT JOIN public.barbers b ON b.id = p.id
WHERE p.full_name ILIKE '%gabriel%';
-- Se não achar pelo nome, tente:
-- WHERE p.role = 'barber';


-- ── PASSO 2: Verificar se JÁ existe em auth.users ─────────────
-- Se retornar resultado, ele JÁ tem conta de login → só resetar senha
-- (use a página /admin/reset-senha do site)
SELECT id, email, created_at
FROM auth.users
WHERE email = 'gabriel@barber.com';


-- ── PASSO 3: Criar conta de Auth com a API do Supabase ────────
-- O Supabase NÃO permite inserir direto em auth.users via SQL seguro.
-- A forma correta é usar a função interna:

SELECT auth.uid(); -- só para testar conexão


-- ================================================================
-- SOLUÇÃO DEFINITIVA VIA SUPABASE DASHBOARD (1 minuto):
-- ================================================================
-- 1. Vá em: Authentication → Users → "+ Add user" (ou "Invite user")
-- 2. Coloque o email: gabriel@barber.com
-- 3. Coloque a senha: S@njrhoff1 (ou outra)
-- 4. Clique em "Create user"
-- 5. Pegue o UUID gerado (campo "User UID")
-- 6. Rode o SQL abaixo substituindo 'UUID_NOVO_AQUI' pelo UUID gerado:

-- Após criar o usuário no Dashboard:
UPDATE public.profiles
SET id = 'UUID_NOVO_AQUI'   -- ← cole o UUID gerado pelo Supabase
WHERE full_name ILIKE '%gabriel%'
  AND role = 'barber';

-- E também atualizar a tabela barbers:
UPDATE public.barbers
SET id = 'UUID_NOVO_AQUI'   -- ← mesmo UUID
WHERE id = (
    SELECT id FROM public.profiles WHERE full_name ILIKE '%gabriel%'
);

-- E os agendamentos (se houver):
UPDATE public.appointments
SET barber_id = 'UUID_NOVO_AQUI'
WHERE barber_id = (
    SELECT id FROM public.profiles WHERE full_name ILIKE '%gabriel%'
);

-- Verificação final:
SELECT
    u.email,
    p.full_name,
    p.role,
    b.is_active
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.barbers b ON b.id = u.id
WHERE u.email = 'gabriel@barber.com';
