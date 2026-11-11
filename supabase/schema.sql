-- Soul Archive の記録の保存先。Supabase の SQL エディタで一度だけ実行する（何度実行しても安全）。
-- 1人1行で、記録の全体を data（JSON）に入れる。版番号は data の中の schemaVersion で管理する。

create table if not exists public.archives (
  user_id uuid primary key references auth.users (id) on delete cascade,
  schema_version integer not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- 行ごとの権限。ログインした本人の行だけ、読み書きできる。
alter table public.archives enable row level security;

-- 新しい Supabase は表への権限を自動では付けないので、ログイン済みの利用者に明示的に付ける。
-- （anon＝ログインしていない人には付けない）
grant select, insert, update on public.archives to authenticated;

drop policy if exists "archives: 本人だけ読める" on public.archives;
create policy "archives: 本人だけ読める"
  on public.archives for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "archives: 本人だけ作れる" on public.archives;
create policy "archives: 本人だけ作れる"
  on public.archives for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "archives: 本人だけ更新できる" on public.archives;
create policy "archives: 本人だけ更新できる"
  on public.archives for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
