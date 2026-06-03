-- 0010: Week-2 prep + audit fixes.

-- (1) Roster: any member may see all members of their campaigns (was self-or-DM
-- only), so the campaign page shows the whole table to players too. Safe:
-- is_member is SECURITY DEFINER + campaign_members is NO FORCE -> no recursion.
drop policy if exists campaign_members_select on public.campaign_members;
create policy campaign_members_select on public.campaign_members for select to authenticated
  using ( user_id = (select auth.uid()) or public.is_member(campaign_id) );

-- (2) character_name: a member may set their OWN character name. The column-scoped
-- UPDATE grant means they can change ONLY character_name (never role/user_id), so
-- there is no privilege-escalation path even though the row is theirs to update.
grant update (character_name) on public.campaign_members to authenticated;
drop policy if exists campaign_members_update_own on public.campaign_members;
create policy campaign_members_update_own on public.campaign_members for update to authenticated
  using ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

-- join_campaign now accepts an optional character name, set on the new membership.
drop function if exists public.join_campaign(text);
create or replace function public.join_campaign(p_invite_code text, p_character_name text default null)
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

  insert into public.campaign_members (campaign_id, user_id, role, character_name)
  values (v_campaign.id, v_uid, 'player', nullif(btrim(coalesce(p_character_name, '')), ''))
  on conflict (campaign_id, user_id) do nothing;

  return v_campaign;
end;
$$;
revoke execute on function public.join_campaign(text, text) from public, anon;
grant  execute on function public.join_campaign(text, text) to authenticated;
