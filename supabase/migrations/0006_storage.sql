-- 0006: storage bucket + crash-proof, fail-closed policies.
insert into storage.buckets (id, name, public)
values ('entity-images', 'entity-images', false)
on conflict (id) do update set public = false;

drop policy if exists entity_images_select on storage.objects;
create policy entity_images_select on storage.objects for select to authenticated
  using (
    bucket_id = 'entity-images'
    and array_length(storage.foldername(name), 1) >= 1
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists entity_images_insert on storage.objects;
create policy entity_images_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'entity-images'
    and array_length(storage.foldername(name), 1) >= 1
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.is_dm(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists entity_images_update on storage.objects;
create policy entity_images_update on storage.objects for update to authenticated
  using (
    bucket_id = 'entity-images'
    and array_length(storage.foldername(name), 1) >= 1
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.is_dm(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'entity-images'
    and array_length(storage.foldername(name), 1) >= 1
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.is_dm(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists entity_images_delete on storage.objects;
create policy entity_images_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'entity-images'
    and array_length(storage.foldername(name), 1) >= 1
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.is_dm(((storage.foldername(name))[1])::uuid)
  );
-- RESIDUAL RISK (A): storage RLS gates on membership, not entities.visibility; a member who guesses
-- a still-secret entity image path can fetch the binary. Mitigate via random uuid filenames + upload-on-reveal,
-- or a can_read_entity_image() SECURITY DEFINER check that re-validates visibility.