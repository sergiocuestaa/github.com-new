-- ============================================================
-- ESQUEMA: SaaS de gestión clínica (Agenda + Pacientes + IA)
-- Ejecutar completo en el SQL Editor de Supabase (Project > SQL Editor)
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- SETTINGS: fila única con la config del negocio (moneda, horario)
-- El agente de voz y /api/availability la usan para saber cuándo
-- el negocio está abierto.
-- ------------------------------------------------------------
create table if not exists settings (
  id int primary key default 1 check (id = 1), -- fuerza una sola fila
  business_name text not null default '',
  email text,
  currency text not null default 'MXN',
  hours_open time not null default '09:00',
  hours_close time not null default '19:00',
  updated_at timestamptz not null default now()
);

insert into settings (id) values (1)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- STAFF: especialistas / personal que atiende citas
-- ------------------------------------------------------------
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SERVICES: catálogo de servicios con precio y duración
-- ------------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null default 0,
  duration_minutes int not null default 30 check (duration_minutes > 0),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CLIENTS: directorio de pacientes/clientes
-- ------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists clients_phone_idx on clients (phone);

-- ------------------------------------------------------------
-- APPOINTMENTS: citas, con snapshot de precio/duración al
-- momento de agendar (así el historial no cambia si luego
-- editas el precio de un servicio).
-- ------------------------------------------------------------
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  date date not null,
  time time not null,
  duration_minutes int not null default 30,
  price numeric(10, 2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'no_show', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists appointments_date_staff_idx
  on appointments (date, staff_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
-- Estas políticas son PERMISIVAS A PROPÓSITO: cualquier request
-- con la anon key puede leer y escribir. Esto es correcto para
-- un panel interno de un solo negocio (sin login todavía), pero
-- NO es seguro para multi-tenant público. Antes de dar de alta
-- más de un negocio o exponer signup público, hay que:
--   1) Agregar Supabase Auth,
--   2) Agregar una columna business_id a cada tabla,
--   3) Cambiar estas políticas a `using (business_id = auth.uid())`.
-- Las rutas de API (app/api/*) usan la service role key y por
-- tanto ignoran RLS por completo — son el canal seguro para el
-- agente de voz.
-- ============================================================

alter table settings enable row level security;
alter table staff enable row level security;
alter table services enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;

create policy "settings_read_write" on settings
  for all using (true) with check (true);

create policy "staff_read_write" on staff
  for all using (true) with check (true);

create policy "services_read_write" on services
  for all using (true) with check (true);

create policy "clients_read_write" on clients
  for all using (true) with check (true);

create policy "appointments_read_write" on appointments
  for all using (true) with check (true);

-- ------------------------------------------------------------
-- REALTIME: habilita que el frontend reciba cambios en vivo
-- (necesario para que el calendario se actualice solo cuando
-- el agente de voz agenda una cita vía la API).
-- ------------------------------------------------------------
alter publication supabase_realtime add table appointments;
