
-- 0. Create Auth Users (Required for Foreign Key Constraints)
-- We insert these into auth.users so the public.profiles can reference them.
-- Passwords are 'password123' (hashed for demo purposes, might not work for actual login without correct hashing function)

INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'authenticated', 'authenticated', 'pedro@barber.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789', now(), '{"full_name": "Pedro Silva"}', now(), now()),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'authenticated', 'authenticated', 'lucas@barber.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789', now(), '{"full_name": "Lucas Melo"}', now(), now()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'authenticated', 'authenticated', 'gabriel@barber.com', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0123456789', now(), '{"full_name": "Gabriel Souza"}', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 1. Create Profiles for Barbers
INSERT INTO public.profiles (id, full_name, role, phone, avatar_url)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pedro Silva', 'barber', '(11) 99999-0001', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lucas Melo', 'barber', '(11) 99999-0002', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Gabriel Souza', 'barber', '(11) 99999-0003', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriel')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Barbers Details
INSERT INTO public.barbers (id, bio, specialties, instagram_handle, is_active)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Especialista em cortes clássicos e degradê navalhado.', ARRAY['Degradê', 'Corte Clássico'], '@pedrosilvabarber', true),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Mestre em barboterapia e visagismo.', ARRAY['Barba', 'Pigmentação'], '@lucasmelo_cuts', true),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Foco em cortes modernos e texturizados.', ARRAY['Freestyle', 'Platinado'], '@gabriel_barber', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Services
INSERT INTO public.services (name, description, duration_minutes, price, category, is_active)
VALUES
    ('Corte Cabelo', 'Corte completo com lavagem e finalização.', 40, 60.00, 'hair', true),
    ('Barba Terapia', 'Protocolo completo com toalha quente e massagem.', 30, 45.00, 'beard', true),
    ('Combo Premium', 'Corte + Barba + Sobrancelha.', 60, 95.00, 'combo', true),
    ('Sobrancelha', 'Design na navalha.', 15, 20.00, 'treatment', true);

-- 4. Create Availability
DO $$
DECLARE
    v_barber_id uuid;
    v_day_num integer;
BEGIN
    FOREACH v_barber_id IN ARRAY ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'::uuid]
    LOOP
        FOR v_day_num IN 1..6 LOOP -- 1=Mon, 6=Sat
            INSERT INTO public.availability (barber_id, day_of_week, start_time, end_time, break_start, break_end)
            VALUES (v_barber_id, v_day_num, '09:00:00', '19:00:00', '12:00:00', '13:00:00')
            ON CONFLICT (barber_id, day_of_week) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
