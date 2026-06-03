-- 0004: RLS + policies. (select auth.uid()) initplan wrapping throughout; default-deny implicit.
alter table public.profiles        enable row level security;
alter table public.campaigns        enable row level security;
alter table public.campaign_members enable row level security;
alter table public.sessions         enable row level security;
alter table public.quotes           enable row level security;
alter table public.entities         enable row level security;
alter table public.log_entries      enable row level security;
alter table public.private_notes    enable row level security;
-- DO NOT FORCE RLS on campaign_members: definer helpers/RPCs depend on owner-exemption.

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using ( id = (select auth.uid()) or public.shares_campaign(id) );
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check ( id = (select auth.uid()) );
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using ( id = (select auth.uid()) ) with check ( id = (select auth.uid()) );

drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns for select to authenticated
  using ( public.is_member(id) or dm_id = (select auth.uid()) );
drop policy if exists campaigns_update on public.campaigns;
create policy campaigns_update on public.campaigns for update to authenticated
  using ( public.is_dm(id) ) with check ( public.is_dm(id) );
drop policy if exists campaigns_delete on public.campaigns;
create policy campaigns_delete on public.campaigns for delete to authenticated
  using ( public.is_dm(id) );

drop policy if exists campaign_members_select on public.campaign_members;
create policy campaign_members_select on public.campaign_members for select to authenticated
  using ( user_id = (select auth.uid()) or public.is_dm(campaign_id) );

drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated
  using ( public.is_member(campaign_id) );
drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions for insert to authenticated
  with check ( public.is_dm(campaign_id) and created_by = (select auth.uid()) );
drop policy if exists sessions_update on public.sessions;
create policy sessions_update on public.sessions for update to authenticated
  using ( public.is_dm(campaign_id) ) with check ( public.is_dm(campaign_id) );
drop policy if exists sessions_delete on public.sessions;
create policy sessions_delete on public.sessions for delete to authenticated
  using ( public.is_dm(campaign_id) );

drop policy if exists entities_select on public.entities;
create policy entities_select on public.entities for select to authenticated
  using ( public.is_member(campaign_id) and (visibility = 'shared' or public.is_dm(campaign_id)) );
drop policy if exists entities_insert on public.entities;
create policy entities_insert on public.entities for insert to authenticated
  with check ( public.is_dm(campaign_id) and created_by = (select auth.uid()) );
drop policy if exists entities_update on public.entities;
create policy entities_update on public.entities for update to authenticated
  using ( public.is_dm(campaign_id) ) with check ( public.is_dm(campaign_id) );
drop policy if exists entities_delete on public.entities;
create policy entities_delete on public.entities for delete to authenticated
  using ( public.is_dm(campaign_id) );

drop policy if exists log_entries_select on public.log_entries;
create policy log_entries_select on public.log_entries for select to authenticated
  using ( public.is_member(campaign_id) and (visibility = 'shared' or public.is_dm(campaign_id)) );
drop policy if exists log_entries_insert on public.log_entries;
create policy log_entries_insert on public.log_entries for insert to authenticated
  with check ( public.is_dm(campaign_id) and created_by = (select auth.uid()) );
drop policy if exists log_entries_update on public.log_entries;
create policy log_entries_update on public.log_entries for update to authenticated
  using ( public.is_dm(campaign_id) ) with check ( public.is_dm(campaign_id) );
drop policy if exists log_entries_delete on public.log_entries;
create policy log_entries_delete on public.log_entries for delete to authenticated
  using ( public.is_dm(campaign_id) );

drop policy if exists quotes_select on public.quotes;
create policy quotes_select on public.quotes for select to authenticated
  using ( public.is_member(campaign_id) and (visibility = 'shared' or public.is_dm(campaign_id)) );
drop policy if exists quotes_insert on public.quotes;
create policy quotes_insert on public.quotes for insert to authenticated
  with check ( public.is_member(campaign_id) and created_by = (select auth.uid()) );
drop policy if exists quotes_update on public.quotes;
create policy quotes_update on public.quotes for update to authenticated
  using ( created_by = (select auth.uid()) or public.is_dm(campaign_id) )
  with check ( created_by = (select auth.uid()) or public.is_dm(campaign_id) );
drop policy if exists quotes_delete on public.quotes;
create policy quotes_delete on public.quotes for delete to authenticated
  using ( created_by = (select auth.uid()) or public.is_dm(campaign_id) );

-- private_notes: author-only AND current member (no is_dm arm: 'only the author, ever').
drop policy if exists private_notes_all on public.private_notes;
create policy private_notes_all on public.private_notes for all to authenticated
  using ( author_id = (select auth.uid()) and public.is_member(campaign_id) )
  with check ( author_id = (select auth.uid()) and public.is_member(campaign_id) );