drop trigger if exists on_auth_user_created_profile on auth.users;
drop function if exists public.create_operator_profile();
drop table if exists public.profiles cascade;

alter table public.incidents
  drop column if exists created_by;

alter table public.incidents enable row level security;
alter table public.dispatch_config enable row level security;

drop policy if exists "Authenticated operators read incidents" on public.incidents;
drop policy if exists "Public read incidents" on public.incidents;
create policy "Public read incidents"
  on public.incidents for select to anon, authenticated
  using (true);

drop policy if exists "Authenticated operators read dispatch config" on public.dispatch_config;
drop policy if exists "Public read dispatch config" on public.dispatch_config;
create policy "Public read dispatch config"
  on public.dispatch_config for select to anon, authenticated
  using (true);

drop policy if exists "Supervisors update dispatch config" on public.dispatch_config;
drop policy if exists "Public update dispatch config" on public.dispatch_config;
create policy "Public update dispatch config"
  on public.dispatch_config for update to anon, authenticated
  using (true)
  with check (true);

grant select on public.incidents to anon, authenticated;
grant select on public.dispatch_config to anon, authenticated;
grant update (
  escalation_seconds,
  confidence_threshold,
  language,
  auto_dispatch_enabled,
  phone_override,
  updated_at
) on public.dispatch_config to anon, authenticated;

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
    dc.phone_override
  from public.dispatch_config as dc
  where dc.id = true;
$$;

revoke all on function public.get_dispatch_config() from public;
grant execute on function public.get_dispatch_config() to anon, authenticated;

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
  insert into public.incidents (id, status, deadline_at, data, created_at, updated_at)
  values (p_id, 'AWAITING', v_deadline, v_data, v_now, v_now)
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
    when 'dismiss' then 'Incident dismissed'
    when 'acknowledge' then 'Incident acknowledged'
    when 'dispatch' then 'Dispatch request recorded'
    else 'Escalation deadline reached'
  end;
  v_description := case p_action
    when 'dismiss' then 'Detection marked as a false positive.'
    when 'acknowledge' then 'Incident marked as verified.'
    when 'dispatch' then 'Dispatch request recorded for ' || coalesce(nullif(p_responder, ''), '112 ERSS & 108 CATS Ambulance') || '. No outbound call was placed.'
    else 'The database-verified response deadline expired without action.'
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
grant execute on function public.create_incident(text, jsonb) to anon, authenticated;
grant execute on function public.transition_incident(text, text, text) to anon, authenticated;
