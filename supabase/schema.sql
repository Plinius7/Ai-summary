create extension if not exists "pgcrypto";

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  content_hash text not null,
  text_content text not null,
  summary text,
  summary_status text not null default 'processing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents(user_id);
create unique index if not exists documents_user_hash_idx on public.documents(user_id, content_hash);

alter table public.documents enable row level security;

create policy "Documents are viewable by owners"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Documents are insertable by owners"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Documents are updatable by owners"
  on public.documents for update
  using (auth.uid() = user_id);
