-- Some products compare similar items rather than the identical product at each shop
-- (for example three different black bags). Those are labelled "Similar items" and
-- never claim a "lowest price" for the same thing.
-- Run once in the Supabase SQL Editor.

alter table public.products add column if not exists similar_items boolean not null default false;

-- The products whose shop links are different items, as of 5 November 2026.
update public.products set similar_items = true where id in (
  '56987be6-7343-49d2-a908-465917aafead', -- Black Bag
  '3a5cf6ca-b4bb-4e58-8652-8407d6c1a0a3', -- White Shirt
  'dd1e7d7d-1100-4139-a5b5-dd9f777fe103', -- Light Blue Baggy Jeans
  'ec7d3931-e5b1-4170-936f-daaf336ce825', -- White Comforter Set
  '0127aac6-3d61-4ef7-9bbd-61398f6ac6e8', -- 3 Seater L Couch Corduroy Fabric
  '1c3fcdcb-5f17-4df9-881b-8b1ce5a896e9', -- 7 Piece Authentic Cast Iron Dutch Oven Cookware Set
  'cc58e1f2-c06a-4d46-a49a-84c907849b73'  -- Galaxy Projector Light Astronaut
);

-- Lets the site owner switch the label on or off for a product in Discover.
-- (Shoppers change their own private products through the normal rules.)
create or replace function public.set_similar_items(product uuid, is_similar boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Only the site owner can edit Discover products';
  end if;
  update public.products set similar_items = is_similar where id = product and listed;
end;
$$;

revoke execute on function public.set_similar_items(uuid, boolean) from public, anon;
grant execute on function public.set_similar_items(uuid, boolean) to authenticated;

-- Gift registries show the label too: same as 0012, plus 'similar_items'.
create or replace function public.get_registry(code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'occasion', w.occasion,
    'event_date', w.event_date,
    'message', w.message,
    'gifts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', p.id,
        'name', p.name,
        'category', p.category,
        'image', p.image,
        'listed', p.listed,
        'similar_items', p.similar_items,
        'taken', exists (select 1 from public.gift_reservations r
                         where r.wishlist_id = w.id and r.product_id = p.id),
        'offers', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', o.id, 'shop', o.shop_name, 'price', o.price_zar,
            'url', o.url, 'checked_at', o.price_checked_at) order by o.price_zar)
          from public.offers o where o.product_id = p.id), '[]'::jsonb)
      ) order by i.saved_at desc)
      from public.wishlist_items i
      join public.products p on p.id = i.product_id
      where i.wishlist_id = w.id), '[]'::jsonb)
  )
  from public.wishlists w
  where w.share_code = code and w.kind = 'registry';
$$;
