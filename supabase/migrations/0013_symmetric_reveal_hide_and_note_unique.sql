-- 0013: Make reveal/hide symmetric + idempotent (Week-3 review fixes).
-- (a) reveal_entity must not pile up duplicate 'reveal' moments on re-reveal.
-- (b) hide_entity must also hide the reveal moment, else re-hiding a card leaves
--     "<Name> was revealed." on the player timeline (a secret-name leak).

create or replace function public.reveal_entity(p_entity_id uuid)
returns public.entities language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := (select auth.uid());
  v_entity public.entities;
  v_log_id uuid;
  v_body   text;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '28000'; end if;
  select * into v_entity from public.entities where id = p_entity_id;
  if not found then raise exception 'entity not found' using errcode = 'P0002'; end if;
  if not public.is_dm(v_entity.campaign_id) then
    raise exception 'only the DM may reveal an entity' using errcode = '42501';
  end if;
  if v_entity.visibility = 'shared' then return v_entity; end if;

  update public.entities set visibility = 'shared', revealed_at = now()
   where id = p_entity_id returning * into v_entity;

  v_body := coalesce(nullif(btrim(v_entity.name), ''), 'An entity') || ' was revealed.';

  -- Reuse the existing reveal moment if the card was revealed before (re-share it);
  -- otherwise create one. Prevents duplicate timeline entries on re-reveal.
  select id into v_log_id from public.log_entries
   where entity_id = v_entity.id and type = 'reveal' order by created_at limit 1;

  if v_log_id is not null then
    update public.log_entries
       set visibility = 'shared', revealed_at = now(), body = v_body
     where id = v_log_id;
  else
    insert into public.log_entries (campaign_id, entity_id, type, body, visibility, revealed_at, created_by)
    values (v_entity.campaign_id, v_entity.id, 'reveal', v_body, 'shared', now(), v_uid);
  end if;

  return v_entity;
end;
$$;
revoke execute on function public.reveal_entity(uuid) from public, anon;
grant  execute on function public.reveal_entity(uuid) to authenticated;

create or replace function public.hide_entity(p_entity_id uuid)
returns public.entities language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := (select auth.uid());
  v_entity public.entities;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '28000'; end if;
  select * into v_entity from public.entities where id = p_entity_id;
  if not found then raise exception 'entity not found' using errcode = 'P0002'; end if;
  if not public.is_dm(v_entity.campaign_id) then
    raise exception 'only the DM may hide an entity' using errcode = '42501';
  end if;

  update public.entities set visibility = 'secret', revealed_at = null
   where id = p_entity_id returning * into v_entity;

  -- Hide the reveal moment too, so the player timeline no longer leaks the name.
  update public.log_entries set visibility = 'secret'
   where entity_id = p_entity_id and type = 'reveal';

  return v_entity;
end;
$$;
revoke execute on function public.hide_entity(uuid) from public, anon;
grant  execute on function public.hide_entity(uuid) to authenticated;

-- private_notes: one note per (author, entity) so find-or-create becomes a
-- race-free upsert. NULLS DISTINCT (default) leaves non-entity notes unconstrained.
create unique index if not exists uq_private_notes_author_entity
  on public.private_notes (author_id, entity_id);
