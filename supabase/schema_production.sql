-- ==============================================================================
-- BARBER PREMIUM - SCHEMA CONSOLIDADO PARA PRODUÇÃO (SUPABASE POSTGRESQL)
-- Versão: 1.0.0 - 100% Idempotente e Livre de Loops de Recursão em RLS
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELAS DO SISTEMA
-- ==============================================================================

-- 2.1 PROFILES (Estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  avatar_url text,
  role text CHECK (role IN ('customer', 'barber', 'admin')) DEFAULT 'customer',
  phone text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 BARBERS (Dados profissionais dos barbeiros)
CREATE TABLE IF NOT EXISTS public.barbers (
  id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  bio text,
  specialties text[],
  instagram_handle text,
  is_active boolean DEFAULT true
);

-- 2.3 SERVICES (Catálogo de serviços)
CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  category text CHECK (category IN ('hair', 'beard', 'combo', 'treatment')) DEFAULT 'hair',
  is_active boolean DEFAULT true
);

-- 2.4 AVAILABILITY (Horários de atendimento e expediente dos barbeiros)
CREATE TABLE IF NOT EXISTS public.availability (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id uuid REFERENCES public.barbers(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_start time,
  break_end time,
  UNIQUE(barber_id, day_of_week)
);

-- 2.5 APPOINTMENTS (Agendamentos com suporte a guest checkout e PIX EMVCo)
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  barber_id uuid REFERENCES public.barbers(id) NOT NULL,
  service_ids uuid[] NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  total_price numeric(10,2) NOT NULL,
  status text CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
  payment_method text CHECK (payment_method IN ('credit_card', 'pix', 'in_person')),
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  pix_txid text,
  pix_payload text,
  pix_expiration timestamptz,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migração Idempotente: Garantir que colunas recentes existam caso tabela já tenha sido criada antes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'customer_name') THEN
        ALTER TABLE public.appointments ADD COLUMN customer_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'customer_phone') THEN
        ALTER TABLE public.appointments ADD COLUMN customer_phone text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'pix_txid') THEN
        ALTER TABLE public.appointments ADD COLUMN pix_txid text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'pix_payload') THEN
        ALTER TABLE public.appointments ADD COLUMN pix_payload text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'pix_expiration') THEN
        ALTER TABLE public.appointments ADD COLUMN pix_expiration timestamptz;
    END IF;
END $$;

-- ==============================================================================
-- 3. FUNÇÕES SEGURAS (SECURITY DEFINER) - ANTI-RECURSÃO RLS
-- ==============================================================================

-- 3.1 Verificação de Administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3.2 Verificação de Equipe (Admin ou Barbeiro)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'barber')
  );
$$;

-- 3.3 RPC: Cálculo de Horários Ocupados (Fuso America/Sao_Paulo)
CREATE OR REPLACE FUNCTION public.get_busy_slots(
  p_barber_id uuid,
  p_start_time timestamptz,
  p_end_time timestamptz
)
RETURNS TABLE (start_time timestamptz, end_time timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT a.start_time, a.end_time
  FROM public.appointments a
  WHERE a.barber_id = p_barber_id
    AND a.status NOT IN ('cancelled')
    AND (a.start_time < p_end_time AND a.end_time > p_start_time);
$$;

-- 3.4 Trigger para criação automática de perfil após Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(excluded.full_name, profiles.full_name),
    avatar_url = COALESCE(excluded.avatar_url, profiles.avatar_url);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. HABILITAÇÃO E DEFINIÇÃO DE POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Limpar policies antigas para idempotência garantida
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'barbers', 'services', 'availability', 'appointments')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 4.1 POLICIES: PROFILES
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own_or_admin" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- 4.2 POLICIES: SERVICES (Público lê catálogo, Admin gerencia)
CREATE POLICY "services_select_public" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "services_all_admin" ON public.services
  FOR ALL USING (public.is_admin());

-- 4.3 POLICIES: BARBERS (Público lê profissionais, Admin gerencia)
CREATE POLICY "barbers_select_public" ON public.barbers
  FOR SELECT USING (true);

CREATE POLICY "barbers_all_admin" ON public.barbers
  FOR ALL USING (public.is_admin());

-- 4.4 POLICIES: AVAILABILITY (Público lê escala, Admin ou Barbeiro gerencia)
CREATE POLICY "availability_select_public" ON public.availability
  FOR SELECT USING (true);

CREATE POLICY "availability_all_staff" ON public.availability
  FOR ALL USING (public.is_admin() OR barber_id = auth.uid());

-- 4.5 POLICIES: APPOINTMENTS
-- Inserção: Aberta para clientes cadastrados e checkout guest via anon/authenticated
CREATE POLICY "appointments_insert_public" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Leitura: Cliente vê os seus, Barbeiro vê os agendados com ele, Admin vê todos
CREATE POLICY "appointments_select_authorized" ON public.appointments
  FOR SELECT USING (
    auth.uid() = customer_id
    OR barber_id = auth.uid()
    OR public.is_admin()
  );

-- Atualização: Admin edita qualquer agendamento; Barbeiro pode atualizar agendamentos da sua agenda
CREATE POLICY "appointments_update_authorized" ON public.appointments
  FOR UPDATE USING (
    barber_id = auth.uid()
    OR public.is_admin()
  );

-- Deleção: Exclusiva para Administradores
CREATE POLICY "appointments_delete_admin" ON public.appointments
  FOR DELETE USING (public.is_admin());

-- ==============================================================================
-- 5. SEED DE SERVIÇOS PADRÃO (IDEMPOTENTE)
-- ==============================================================================

INSERT INTO public.services (name, description, duration_minutes, price, category, is_active)
SELECT 'Corte Cabelo Tradicional', 'Corte completo com lavagem especial, finalização com pomada matte e toalha fria.', 40, 65.00, 'hair', true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Corte Cabelo Tradicional');

INSERT INTO public.services (name, description, duration_minutes, price, category, is_active)
SELECT 'Barba Terapia Imperial', 'Protocolo completo com esfoliação, toalha quente com óleos essenciais, massagem facial e navalha.', 35, 50.00, 'beard', true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Barba Terapia Imperial');

INSERT INTO public.services (name, description, duration_minutes, price, category, is_active)
SELECT 'Combo VIP Signature', 'Corte Premium + Barba Terapia Imperial + Sobrancelha com alinhamento milimétrico.', 65, 105.00, 'combo', true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Combo VIP Signature');

INSERT INTO public.services (name, description, duration_minutes, price, category, is_active)
SELECT 'Design de Sobrancelha', 'Alinhamento na navalha e tesoura com acabamento limpo.', 15, 25.00, 'treatment', true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'Design de Sobrancelha');

-- ==============================================================================
-- FIM DO SCRIPT DE PRODUÇÃO
-- ==============================================================================
