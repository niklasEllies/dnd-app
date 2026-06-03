-- 0008: recursion-invariant assertions. Run last; idempotent.
do $$
declare v_forced boolean;
begin
  select relforcerowsecurity into v_forced from pg_class where oid = 'public.campaign_members'::regclass;
  if v_forced then
    raise exception 'campaign_members has FORCE ROW LEVEL SECURITY; reintroduces RLS recursion via is_member/is_dm. Run: ALTER TABLE public.campaign_members NO FORCE ROW LEVEL SECURITY;';
  end if;
end $$;

do $$
declare
  r record;
  v_tbl_owner oid := (select relowner from pg_class where oid = 'public.campaign_members'::regclass);
begin
  for r in
    select p.oid::regprocedure as sig, p.prosecdef, p.provolatile, p.proowner, p.proconfig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('is_member','is_dm','shares_campaign')
  loop
    if not r.prosecdef then raise exception '% lost SECURITY DEFINER -> RLS recursion risk', r.sig; end if;
    if r.provolatile <> 's' then raise exception '% is not STABLE', r.sig; end if;
    if r.proowner <> v_tbl_owner then raise exception '% owner differs from campaign_members owner; definer may not be RLS-exempt', r.sig; end if;
    -- Postgres serializes `SET search_path = ''` as either `search_path=` or `search_path=""`.
    if r.proconfig is null
       or not exists (select 1 from unnest(r.proconfig) cfg
                      where cfg in ('search_path=', 'search_path=""'))
    then raise exception '% missing SET search_path to empty', r.sig; end if;
  end loop;
end $$;

alter table public.campaign_members no force row level security;