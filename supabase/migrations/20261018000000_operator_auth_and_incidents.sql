create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'pending' check (role in ('pending', 'operator', 'supervisor', 'admin')),
  assigned_sector text not null default 'Unassigned',
  created_at timestamptz not null default now()
);

create or replace function public.create_operator_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role, assigned_sector)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'Operator'), '@', 1)),
    'pending',
    coalesce(nullif(new.raw_user_meta_data ->> 'assigned_sector', ''), 'Unassigned')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_operator_profile();

insert into public.profiles (id, display_name, role, assigned_sector)
select
  users.id,
  coalesce(nullif(users.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(users.email, 'Operator'), '@', 1)),
  'pending',
  coalesce(nullif(users.raw_user_meta_data ->> 'assigned_sector', ''), 'Unassigned')
from auth.users as users
on conflict (id) do nothing;

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
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incidents_created_at_idx
  on public.incidents (created_at desc);

alter table public.profiles enable row level security;
alter table public.dispatch_config enable row level security;
alter table public.incidents enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.dispatch_config from anon, authenticated;
revoke all on public.incidents from anon, authenticated;

drop policy if exists "Operators read own profile" on public.profiles;
create policy "Operators read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Authenticated operators read incidents" on public.incidents;
create policy "Authenticated operators read incidents"
  on public.incidents for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('operator', 'supervisor', 'admin')
    )
  );

drop policy if exists "Authenticated operators read dispatch config" on public.dispatch_config;
create policy "Authenticated operators read dispatch config"
  on public.dispatch_config for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('operator', 'supervisor', 'admin')
    )
  );

drop policy if exists "Supervisors update dispatch config" on public.dispatch_config;
create policy "Supervisors update dispatch config"
  on public.dispatch_config for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('supervisor', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('supervisor', 'admin')
    )
  );

grant select on public.profiles to authenticated;
grant select (id), update (
  escalation_seconds,
  confidence_threshold,
  language,
  auto_dispatch_enabled,
  phone_override,
  updated_at
) on public.dispatch_config to authenticated;
grant select on public.incidents to authenticated;

create or replace function public.get_dispatch_config()
returns table (
  escalation_seconds integer,
  confidence_threshold numeric,
  language text,
  auto_dispatch_enabled boolean,
  phone_override text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    dc.escalation_seconds,
    dc.confidence_threshold,
    dc.language,
    dc.auto_dispatch_enabled,
    case when p.role in ('supervisor', 'admin') then dc.phone_override else '' end
  from public.dispatch_config as dc
  join public.profiles as p on p.id = auth.uid()
  where dc.id = true
    and p.role in ('operator', 'supervisor', 'admin');
$$;

revoke all on function public.get_dispatch_config() from public;
grant execute on function public.get_dispatch_config() to authenticated;

create or replace function public.create_incident(p_id text, p_data jsonb)
returns setof public.incidents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deadline timestamptz;
  v_now timestamptz := clock_timestamp();
  v_seconds integer;
  v_data jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('operator', 'supervisor', 'admin')
  ) then
    raise exception 'OPERATOR_ACCESS_REQUIRED';
  end if;

  select escalation_seconds into strict v_seconds
  from public.dispatch_config
  where id = true;

  v_deadline := v_now + make_interval(secs => v_seconds);
  v_data := jsonb_set(
    jsonb_set(
      jsonb_set(p_data, '{status}', '"AWAITING"'::jsonb, true),
      '{deadlineTs}',
      to_jsonb(floor(extract(epoch from v_deadline) * 1000)::bigint),
      true
    ),
    '{remainingSeconds}',
    to_jsonb(v_seconds),
    true
  );

  return query
  insert into public.incidents (id, status, deadline_at, data, created_by, created_at, updated_at)
  values (p_id, 'AWAITING', v_deadline, v_data, auth.uid(), v_now, v_now)
  returning *;
end;
$$;

create or replace function public.transition_incident(
  p_id text,
  p_action text,
  p_responder text default null
)
returns setof public.incidents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_incident public.incidents%rowtype;
  v_status text;
  v_event jsonb;
  v_now timestamptz := clock_timestamp();
  v_title text;
  v_description text;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('operator', 'supervisor', 'admin')
  ) then
    raise exception 'OPERATOR_ACCESS_REQUIRED';
  end if;

  v_status := case p_action
    when 'dismiss' then 'DISMISSED'
    when 'acknowledge' then 'ACKNOWLEDGED'
    when 'dispatch' then 'DISPATCHED'
    when 'auto-escalate' then 'AUTO-ESCALATED'
    else null
  end;

  if v_status is null then
    raise exception 'INVALID_INCIDENT_ACTION';
  end if;

  select * into v_incident
  from public.incidents
  where id = p_id
  for update;

  if not found then
    return;
  end if;

  if v_incident.status = v_status then
    return next v_incident;
    return;
  end if;

  if v_incident.status not in ('DETECTED', 'AWAITING')
     and not (v_incident.status = 'AUTO-ESCALATED' and p_action = 'dispatch') then
    raise exception 'INCIDENT_NOT_ACTIONABLE';
  end if;

  if p_action = 'auto-escalate' and v_incident.deadline_at > v_now then
    raise exception 'INCIDENT_NOT_DUE';
  elsif p_action <> 'auto-escalate'
        and v_incident.status in ('DETECTED', 'AWAITING')
        and v_incident.deadline_at <= v_now then
    raise exception 'INCIDENT_NOT_DUE';
  end if;

  v_title := case p_action
    when 'dismiss' then 'Operator dismissed incident'
    when 'acknowledge' then 'Operator acknowledged incident'
    when 'dispatch' then 'Operator requested emergency dispatch'
    else 'Escalation deadline reached'
  end;
  v_description := case p_action
    when 'dismiss' then 'Operator marked the detection as a false positive.'
    when 'acknowledge' then 'Operator verified the incident.'
    when 'dispatch' then 'Dispatch request recorded for ' || coalesce(nullif(p_responder, ''), '112 ERSS & 108 CATS Ambulance') || '. No outbound call was placed.'
    else 'The database-verified response deadline expired without operator action.'
  end;
  v_event := jsonb_build_object(
    'time', to_char(v_now at time zone 'UTC', 'HH24:MI:SS') || ' UTC',
    'title', v_title,
    'description', v_description,
    'type', case p_action
      when 'dismiss' then 'dismissal'
      when 'acknowledge' then 'acknowledgement'
      when 'dispatch' then 'dispatch'
      else 'system'
    end
  );

  update public.incidents
  set status = v_status,
      data = jsonb_set(
        jsonb_set(
          data,
          '{status}',
          to_jsonb(v_status),
          true
        ),
        '{timeline}',
        coalesce(data -> 'timeline', '[]'::jsonb) || jsonb_build_array(v_event),
        true
      ),
      updated_at = v_now
  where id = p_id
  returning * into v_incident;

  return next v_incident;
end;
$$;

revoke all on function public.create_incident(text, jsonb) from public;
revoke all on function public.transition_incident(text, text, text) from public;
grant execute on function public.create_incident(text, jsonb) to authenticated;
grant execute on function public.transition_incident(text, text, text) to authenticated;
