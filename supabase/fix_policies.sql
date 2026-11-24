
-- FIX: Allow public read access to the barbers table
-- (This was missing, causing the list to be empty)
create policy "Barbers are viewable by everyone" on public.barbers for select using (true);

-- FIX: Allow public/anonymous users to create appointments
-- (Required since we want bookings without mandatory login)
create policy "Anyone can create appointments" on public.appointments for insert with check (true);
