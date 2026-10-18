create table if not exists public.dispatch_config (
  id boolean primary key default true check (id),
  escalation_seconds integer not null default 15 check (escalation_seconds between 5 and 60),
  confidence_threshold numeric not null default 0.85 check (confidence_threshold between 0.5 and 0.95),
  language text not null default 'bilingual' check (language in ('bilingual', 'hindi', 'english')),
  auto_dispatch_enabled boolean not null default true,
  phone_override text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.dispatch_config (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.incidents (
  id text primary key,
  status text not null check (
    status in ('DETECTED', 'AWAITING', 'ACKNOWLEDGED', 'DISPATCHED', 'DISMISSED', 'AUTO-ESCALATED', 'CALLING', 'RESOLVED')
  ),
  deadline_at timestamptz not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incidents_created_at_idx
  on public.incidents (created_at desc);
