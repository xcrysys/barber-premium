
-- ALLOW ADMIN ACTIONS (For Demo Purposes: Allow anyone to Edit Services/Barbers)
-- In production, you would strict this to: using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') )

-- Function to check if policies exist before creating to avoid errors
DO $$
BEGIN
    -- SERVICES
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Enable all access for services') THEN
        create policy "Enable all access for services" on public.services for all using (true) with check (true);
    END IF;

    -- BARBERS (Updates)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'barbers' AND policyname = 'Enable all access for barbers') THEN
        create policy "Enable all access for barbers" on public.barbers for all using (true) with check (true);
    END IF;
END $$;
