-- 0009: Remediate 0003. RLS policy expressions are evaluated as the QUERYING
-- role, so `authenticated` must have EXECUTE on the helper functions the
-- policies call, or every RLS read fails with "permission denied for function".
-- These helpers only report the CALLER's own membership (they use auth.uid()
-- internally), so granting execute to authenticated is safe and is the standard
-- Supabase pattern. (0003 has also been corrected for fresh databases.)
grant execute on function public.is_member(uuid)       to authenticated;
grant execute on function public.is_dm(uuid)           to authenticated;
grant execute on function public.shares_campaign(uuid) to authenticated;
