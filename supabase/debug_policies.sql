
-- LIBERAR LEITURA GERAL DE AGENDAMENTOS (PARA DEBUG)
DROP POLICY IF EXISTS "Allow Select All Appointments" ON public.appointments;
CREATE POLICY "Allow Select All Appointments" ON public.appointments FOR SELECT USING (true);

-- LIBERAR UPDATE TAMBÉM (Para mudar status)
DROP POLICY IF EXISTS "Allow Update All Appointments" ON public.appointments;
CREATE POLICY "Allow Update All Appointments" ON public.appointments FOR UPDATE USING (true);
