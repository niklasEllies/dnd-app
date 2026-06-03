-- 0007: FK indexes + table grants.
create index if not exists idx_campaigns_dm_id            on public.campaigns(dm_id);
create index if not exists idx_campaign_members_campaign  on public.campaign_members(campaign_id);
create index if not exists idx_campaign_members_user      on public.campaign_members(user_id);
create index if not exists idx_campaign_members_user_camp on public.campaign_members(user_id, campaign_id);
create index if not exists idx_sessions_campaign          on public.sessions(campaign_id);
create index if not exists idx_sessions_created_by        on public.sessions(created_by);
create index if not exists idx_quotes_campaign            on public.quotes(campaign_id);
create index if not exists idx_quotes_session             on public.quotes(session_id);
create index if not exists idx_quotes_created_by          on public.quotes(created_by);
create index if not exists idx_entities_campaign          on public.entities(campaign_id);
create index if not exists idx_entities_created_by        on public.entities(created_by);
create index if not exists idx_log_entries_campaign       on public.log_entries(campaign_id);
create index if not exists idx_log_entries_session        on public.log_entries(session_id);
create index if not exists idx_log_entries_entity         on public.log_entries(entity_id);
create index if not exists idx_log_entries_created_by     on public.log_entries(created_by);
create index if not exists idx_private_notes_campaign     on public.private_notes(campaign_id);
create index if not exists idx_private_notes_author       on public.private_notes(author_id);
create index if not exists idx_private_notes_entity       on public.private_notes(entity_id);
create index if not exists idx_private_notes_session      on public.private_notes(session_id);

grant usage on schema public to authenticated, anon;
revoke all on all tables in schema public from anon, authenticated;

grant select, insert, update          on public.profiles         to authenticated;
grant select, update, delete          on public.campaigns        to authenticated;
grant select                          on public.campaign_members to authenticated;
grant select, insert, update, delete  on public.sessions         to authenticated;
grant select, insert, update, delete  on public.entities         to authenticated;
grant select, insert, update, delete  on public.log_entries      to authenticated;
grant select, insert, update, delete  on public.quotes           to authenticated;
grant select, insert, update, delete  on public.private_notes    to authenticated;