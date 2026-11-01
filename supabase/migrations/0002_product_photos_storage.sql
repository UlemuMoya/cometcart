-- Photo storage for products people add. Run once in the Supabase SQL Editor.
-- Photos are public to view (they appear on product pages). People can only
-- upload or delete files inside their own folder (named after their user id).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Signed-in people upload product photos to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "People can delete their own product photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
