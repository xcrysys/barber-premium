
-- CORREÇÃO: Remover a coluna 'email' pois ela não existe na tabela profiles (apenas em auth.users)

INSERT INTO public.profiles (id, full_name, role)
VALUES (
    'd496701b-7eec-4a77-9812-a0271fda26ee', -- Seu ID
    'Admin Sandro',                         -- Seu Nome
    'admin'                                 -- Sua Role
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
