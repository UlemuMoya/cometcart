-- Products can be added from a photo (for example, seen in a shop) without a
-- product link. Their offer then has a shop and price but no url.
-- Run once in the Supabase SQL Editor.

alter table public.offers alter column url drop not null;

-- A link, when there is one, must be a web address.
alter table public.offers
  add constraint offers_url_is_web check (url is null or url ~* '^https?://');
