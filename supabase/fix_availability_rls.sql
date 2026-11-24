
-- CORREÇÃO DE PERMISSÕES: AVAILABILITY (AGENDA)
-- Libera o admin para editar a tabela de disponibilidade.

-- ==============================================================================
-- TABELA AVAILABILITY
-- ==============================================================================
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS "Availability is viewable by everyone" ON public.availability;
DROP POLICY IF EXISTS "Public Select Availability" ON public.availability;
DROP POLICY IF EXISTS "Admin All Availability" ON public.availability;

-- Política de Leitura: Todo mundo vê (Público - para agendamento)
CREATE POLICY "Public Select Availability" ON public.availability
    FOR SELECT USING (true);

-- Política de Escrita: Apenas Admin (para definir horários dos barbeiros)
CREATE POLICY "Admin All Availability" ON public.availability
    FOR ALL USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- Política EXTRA: O Próprio Barbeiro pode editar sua agenda (se ele logar)
CREATE POLICY "Barber Update Own Schedule" ON public.availability
    FOR ALL USING (
        auth.uid() = barber_id
    );
