
-- TRIGGER AUTOMÁTICO PARA CRIAR PERFIL (VERSÃO CORRIGIDA - SEM EMAIL)
-- Removemos a coluna 'email' pois ela só existe em auth.users, não em profiles.

-- 1. Cria a função que executa quando usuário é criado
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id, 
    new.raw_user_meta_data ->> 'full_name', 
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  );
  return new;
end;
$$;

-- 2. Garante que o Trigger existe na tabela auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. BONUS: CORRIGIR USUÁRIOS PERDIDOS
-- Cria perfis para quem tem usuário mas não tem perfil (apenas com ID e role customer)
INSERT INTO public.profiles (id, role)
SELECT id, 'customer'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;
