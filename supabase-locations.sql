-- Wijnkelder: locaties toevoegen
-- Voer dit uit in de Supabase SQL editor.

-- 1. Kolom voor de locatie op bestaande wijnen
alter table public.wines
  add column if not exists location text;

-- 2. Tabel met beheerbare locaties per gebruiker
create table if not exists public.wine_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- 3. Row Level Security zodat gebruikers alleen hun eigen locaties zien
alter table public.wine_locations enable row level security;

create policy "Gebruikers zien eigen locaties"
  on public.wine_locations for select
  using (auth.uid() = user_id);

create policy "Gebruikers voegen eigen locaties toe"
  on public.wine_locations for insert
  with check (auth.uid() = user_id);

create policy "Gebruikers verwijderen eigen locaties"
  on public.wine_locations for delete
  using (auth.uid() = user_id);
