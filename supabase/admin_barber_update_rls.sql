-- ================================================================
-- FIX: Allow Admin Server Actions to UPDATE/DELETE appointments
-- Run this in Supabase SQL Editor
-- ================================================================

-- Since we use service_role key in Server Actions, RLS is bypassed.
-- No SQL change needed for the Server Actions themselves.
-- BUT: if you want the anon/authenticated users to update via client,
-- add these policies:

-- Allow authenticated admin to update any appointment
create policy "Admin full update" on public.appointments
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (true);

-- Allow barbers to update their own appointments (status only, handled by Server Action)
create policy "Barber update own appointments" on public.appointments
  for update to authenticated
  using (
    barber_id = auth.uid()
  )
  with check (
    barber_id = auth.uid()
  );

-- Allow admin to delete
create policy "Admin delete appointments" on public.appointments
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
