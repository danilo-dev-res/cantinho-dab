-- =====================================================================
--  Nosso Cantinho (DAB) · cria tudo que o site precisa no Supabase
--  Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--  Pode rodar de novo sem problema: ele não apaga nada.
-- =====================================================================

-- 1) A tabela onde ficam as datas, a semana, as informações das fotos e a aba Nós
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                      -- event | photo | schedule | settings
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists items_kind_idx on public.items (kind, created_at);

-- 2) Segurança: só quem entrou no site com a senha consegue ler ou mexer
alter table public.items enable row level security;
grant select, insert, update, delete on public.items to authenticated;

drop policy if exists "casal faz tudo" on public.items;
create policy "casal faz tudo" on public.items
  for all to authenticated using (true) with check (true);

-- 3) Tempo real: o que um muda aparece na hora no celular do outro
do $$
begin
  alter publication supabase_realtime add table public.items;
exception when duplicate_object then null;
end $$;

-- 4) A pasta PRIVADA onde as fotos ficam guardadas
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

drop policy if exists "casal ve fotos" on storage.objects;
drop policy if exists "casal envia fotos" on storage.objects;
drop policy if exists "casal atualiza fotos" on storage.objects;
drop policy if exists "casal apaga fotos" on storage.objects;

create policy "casal ve fotos" on storage.objects
  for select to authenticated using (bucket_id = 'fotos');
create policy "casal envia fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');
create policy "casal atualiza fotos" on storage.objects
  for update to authenticated using (bucket_id = 'fotos');
create policy "casal apaga fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos');
