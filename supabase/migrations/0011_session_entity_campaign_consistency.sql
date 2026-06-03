-- 0011: A child row's session_id / entity_id MUST belong to the same campaign as
-- the child. The plain existence-only FKs don't relate the two, so a member of
-- campaign A could attach a quote/log/note to a session/entity of campaign B.
-- Enforced here with BEFORE INSERT/UPDATE triggers (SECURITY DEFINER so the
-- consistency check is authoritative, independent of the writer's RLS view).

create or replace function public.check_session_campaign()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.session_id is not null
     and not exists (select 1 from public.sessions s
                     where s.id = new.session_id and s.campaign_id = new.campaign_id) then
    raise exception 'session_id % does not belong to campaign %', new.session_id, new.campaign_id
      using errcode = '23514';
  end if;
  return new;
end; $$;
revoke execute on function public.check_session_campaign() from public, anon, authenticated;

create or replace function public.check_entity_campaign()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.entity_id is not null
     and not exists (select 1 from public.entities e
                     where e.id = new.entity_id and e.campaign_id = new.campaign_id) then
    raise exception 'entity_id % does not belong to campaign %', new.entity_id, new.campaign_id
      using errcode = '23514';
  end if;
  return new;
end; $$;
revoke execute on function public.check_entity_campaign() from public, anon, authenticated;

drop trigger if exists trg_quotes_session_campaign on public.quotes;
create trigger trg_quotes_session_campaign before insert or update on public.quotes
  for each row execute function public.check_session_campaign();

drop trigger if exists trg_log_entries_session_campaign on public.log_entries;
create trigger trg_log_entries_session_campaign before insert or update on public.log_entries
  for each row execute function public.check_session_campaign();

drop trigger if exists trg_log_entries_entity_campaign on public.log_entries;
create trigger trg_log_entries_entity_campaign before insert or update on public.log_entries
  for each row execute function public.check_entity_campaign();

drop trigger if exists trg_private_notes_session_campaign on public.private_notes;
create trigger trg_private_notes_session_campaign before insert or update on public.private_notes
  for each row execute function public.check_session_campaign();

drop trigger if exists trg_private_notes_entity_campaign on public.private_notes;
create trigger trg_private_notes_entity_campaign before insert or update on public.private_notes
  for each row execute function public.check_entity_campaign();
