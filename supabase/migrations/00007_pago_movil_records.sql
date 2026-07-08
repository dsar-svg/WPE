-- Migration: 00007_pago_movil_records
-- Stores Pago Móvil payment details (reference, payer info)

create table if not exists pago_movil_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  reference text not null,
  payer_cedula text not null,
  payer_phone text not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

alter table pago_movil_records enable row level security;

-- Allow anon and authenticated to insert (needed for POS)
create policy "Anyone can insert pago_movil_records"
  on pago_movil_records for insert
  with check (true);

-- Allow authenticated to select
create policy "Authenticated can select pago_movil_records"
  on pago_movil_records for select
  using (auth.role() = 'authenticated');
