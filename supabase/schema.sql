-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Extends Auth Users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('customer', 'barber', 'admin')) default 'customer',
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BARBERS (Specific details for barbers)
create table public.barbers (
  id uuid references public.profiles(id) on delete cascade not null primary key,
  bio text,
  specialties text[],
  instagram_handle text,
  is_active boolean default true
);

-- SERVICES (Cuts, Shaves, etc.)
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  duration_minutes integer not null,
  price decimal(10,2) not null,
  image_url text,
  category text check (category in ('hair', 'beard', 'combo', 'treatment')) default 'hair',
  is_active boolean default true
);

-- AVAILABILITY (Weekly schedule for each barber)
create table public.availability (
  id uuid default uuid_generate_v4() primary key,
  barber_id uuid references public.barbers(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sunday
  start_time time not null,
  end_time time not null,
  break_start time,
  break_end time,
  unique(barber_id, day_of_week)
);

-- APPOINTMENTS (The core booking)
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.profiles(id), -- Can be null for guest checkout if implemented later, but let's stick to auth for now
  barber_id uuid references public.barbers(id) not null,
  service_ids uuid[] not null, -- Array of service IDs
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  total_price decimal(10,2) not null,
  status text check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')) default 'pending',
  payment_method text check (payment_method in ('credit_card', 'pix', 'in_person')),
  payment_status text check (payment_status in ('pending', 'paid', 'refunded')) default 'pending',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Security)
alter table public.profiles enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.appointments enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Policies for Services/Barbers/Availability (Public Read, Admin Write)
create policy "Services are viewable by everyone" on public.services for select using (true);
create policy "Availability is viewable by everyone" on public.availability for select using (true);

-- Policies for Appointments
create policy "Users can view own appointments" on public.appointments for select using (auth.uid() = customer_id);
create policy "Barbers can view their appointments" on public.appointments for select using (barber_id in (select id from public.barbers where id = auth.uid()));
