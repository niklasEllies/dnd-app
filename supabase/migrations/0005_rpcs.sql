-- 0005: membership RPCs. SECURITY DEFINER, search_path='', fully schema-qualified.
create or replace function public.create_campaign(
  p_name text, p_system text default null, p_description text default null)
returns public.campaigns language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_campaign public.campaigns;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'campaign name is required' using errcode = '22023'; end if;

  -- Self-heal a missing profile so the dm_id -> profiles FK can never raise 23503.
  insert into public.profiles (id, display_name)
  values (v_uid, coalesce(
    (select nullif(u.raw_user_meta_data ->> 'display_name','') from auth.users u where u.id = v_uid),
    (select split_part(u.email,'@',1) from auth.users u where u.id = v_uid),
    'Adventurer'))
  on conflict (id) do nothing;

  insert into public.campaigns (name, system, description, dm_id)
  values (btrim(p_name), p_system, p_description, v_uid)
  returning * into v_campaign;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (v_campaign.id, v_uid, 'dm');

  return v_campaign;
end;
$$;

create or replace function public.join_campaign(p_invite_code text)
returns public.campaigns language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_campaign public.campaigns;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '28000'; end if;

  select * into v_campaign from public.campaigns where invite_code = p_invite_code;
  if not found then raise exception 'invalid invite code' using errcode = 'P0002'; end if;

  if exists (select 1 from public.campaign_members
             where campaign_id = v_campaign.id and user_id = v_uid) then
    return v_campaign;
  end if;

  -- Role/user forced server-side; ON CONFLICT makes a concurrent double-join idempotent (no 23505).
  insert into public.campaign_members (campaign_id, user_id, role)
  values (v_campaign.id, v_uid, 'player')
  on conflict (campaign_id, user_id) do nothing;

  return v_campaign;
end;
$$;

revoke execute on function public.create_campaign(text, text, text) from public, anon;
revoke execute on function public.join_campaign(text)               from public, anon;
grant  execute on function public.create_campaign(text, text, text) to authenticated;
grant  execute on function public.join_campaign(text)               to authenticated;