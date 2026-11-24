
-- FIX APPOINTMENTS RLS
-- Remove policies that might be restrictive
DROP POLICY IF EXISTS "Public Insert Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Customer View Own Appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin All Appointments" ON public.appointments;

-- 1. Permite INSERT público (para Guests e Clientes Logados)
CREATE POLICY "Enable Insert for All" ON public.appointments
    FOR INSERT WITH CHECK (true);

-- 2. Clientes veem seus próprios agendamentos
CREATE POLICY "Customer View Own" ON public.appointments
    FOR SELECT USING (auth.uid() = customer_id);

-- 3. Admins e Barbeiros veem tudo
CREATE POLICY "Staff View All" ON public.appointments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'barber')
        )
    );

-- FIX PROFILES RLS
-- Permite que o usuário edite seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Permite insert público (para o cadastro via Server Action funcionar smooth, embora admin use service role)
-- Mas para segurança, update é o crítico aqui.
