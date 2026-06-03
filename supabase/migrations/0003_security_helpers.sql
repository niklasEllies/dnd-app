-- 0003: SECURITY DEFINER helpers + triggers. All search_path='' and fully schema-qualified.
create or replace function public.is_member(c uuid)
returns boolean language sql security definer stable set search_path = ''
as $$
  select exists (select 1 from public.campaign_members m
                 where m.campaign_id = c and m.user_id = (select auth.uid()));
$$;

create or replace function public.is_dm(c uuid)
returns boolean language sql security definer stable set search_path = ''
as $$
  select exists (select 1 from public.campaign_members m
                 where m.campaign_id = c and m.user_id = (select auth.uid()) and m.role = 'dm');
$$;

create or replace function public.shares_campaign(other uuid)
returns boolean language sql security definer stable set search_path = ''
as $$
  select exists (
    select 1 from public.campaign_members me
    join public.campaign_members them on them.campaign_id = me.campaign_id
    where me.user_id = (select auth.uid()) and them.user_id = other);
$$;

-- RLS policy expressions are evaluated as the QUERYING role, so `authenticated`
-- MUST keep EXECUTE on these helpers or every policy that calls them fails with
-- "permission denied for function". Revoke only from public/anon (they never
-- evaluate the authenticated-only policies). Granting to authenticated is safe:
-- the helpers only ever report the caller's own membership (auth.uid() inside).
revoke execute on function public.is_member(uuid)       from public, anon;
revoke execute on function public.is_dm(uuid)           from public, anon;
revoke execute on function public.shares_campaign(uuid) from public, anon;
grant  execute on function public.is_member(uuid)       to authenticated;
grant  execute on function public.is_dm(uuid)           to authenticated;
grant  execute on function public.shares_campaign(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''),
                           split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
-- Finding B: no role needs direct EXECUTE; the trigger fires as table owner regardless.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Finding A: maintain private_notes.updated_at (was permanently stale on UPDATE).
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_private_notes_updated_at on public.private_notes;
create trigger trg_private_notes_updated_at
  before update on public.private_notes for each row execute function public.set_updated_at();