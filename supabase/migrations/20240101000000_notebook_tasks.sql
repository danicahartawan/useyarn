create type task_status as enum ('active', 'draft', 'waiting', 'queued');
create type proposal_target as enum ('notebook', 'file-tree', 'canvas');

create table notebook_tasks (
  id uuid primary key default gen_random_uuid(),
  notebook_id text not null,
  name text not null,
  status task_status not null default 'draft',
  proposal_target proposal_target not null default 'notebook',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notebook_tasks enable row level security;
create policy "Allow public read/write on notebook_tasks" on notebook_tasks
  for all using (true) with check (true);
