-- 0012: The reveal mechanic as one atomic, DM-only operation: flip an entity
-- secret -> shared (stamp revealed_at) AND drop a 'reveal' entry onto the
-- timeline. SECURITY DEFINER so it can check is_dm and write the log_entry
-- regardless of the per-table policies; it enforces DM authorization itself.
create or replace function public.reveal_entity(p_entity_id uuid)
returns public.entities language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := (select auth.uid());
  v_entity public.entities;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '28000'; end if;

  select * into v_entity from public.entities where id = p_entity_id;
  if not found then raise exception 'entity not found' using errcode = 'P0002'; end if;

  if not public.is_dm(v_entity.campaign_id) then
    raise exception 'only the DM may reveal an entity' using errcode = '42501';
  end if;

  -- Idempotent: already shared -> nothing to do.
  if v_entity.visibility = 'shared' then
    return v_entity;
  end if;

  update public.entities
     set visibility = 'shared', revealed_at = now()
   where id = p_entity_id
   returning * into v_entity;

  insert into public.log_entries (campaign_id, entity_id, type, body, visibility, revealed_at, created_by)
  values (
    v_entity.campaign_id,
    v_entity.id,
    'reveal',
    coalesce(nullif(btrim(v_entity.name), ''), 'An entity') || ' was revealed.',
    'shared',
    now(),
    v_uid
  );

  return v_entity;
end;
$$;
revoke execute on function public.reveal_entity(uuid) from public, anon;
grant  execute on function public.reveal_entity(uuid) to authenticated;
