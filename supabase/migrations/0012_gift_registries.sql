-- Gift registries: shareable lists for an occasion, where guests mark a gift as
-- "I'll get this" (no account needed) so nobody buys the same thing twice.
-- A registry is a wishlist with kind = 'registry'. People can now have several lists.
-- Run once in the Supabase SQL Editor.

alter table public.wishlists
  add column kind text not null default 'wishlist' check (kind in ('wishlist', 'registry')),
  add column occasion text check (occasion in ('wedding', 'baby', 'birthday', 'new_home', 'other')),
  add column event_date date,
  add column message text check (char_length(message) <= 500),
  -- On by default: the owner sees how many gifts are taken, not which ones or by whom.
  add column surprise boolean not null default true;

-------------------------------------------------------------------------------
-- Reservations: one per gift. Guests reserve through the functions below, never directly.
-------------------------------------------------------------------------------
create table public.gift_reservations (
  wishlist_id  uuid not null,
  product_id   uuid not null,
  guest_name   text not null check (char_length(guest_name) between 1 and 40),
  -- Kept in the guest's browser so they can undo their own reservation.
  cancel_token uuid not null default gen_random_uuid(),
  reserved_at  timestamptz not null default now(),
  primary key (wishlist_id, product_id),
  foreign key (wishlist_id, product_id)
    references public.wishlist_items (wishlist_id, product_id) on delete cascade
);

alter table public.gift_reservations enable row level security;

-- The owner may see who reserved what, but only with surprise mode switched off.
create policy "Owners see reservations when surprise mode is off"
  on public.gift_reservations for select to authenticated
  using (exists (
    select 1 from public.wishlists w
    where w.id = wishlist_id and w.owner_id = (select auth.uid()) and not w.surprise));

-- The owner may clear a reservation (e.g. a gift was returned).
create policy "Owners can clear reservations"
  on public.gift_reservations for delete to authenticated
  using (exists (
    select 1 from public.wishlists w
    where w.id = wishlist_id and w.owner_id = (select auth.uid())));

-------------------------------------------------------------------------------
-- What a guest sees from the registry link: details and each gift's product and
-- prices (including products the owner added from shop links), and whether it is
-- taken. Never who took it.
-------------------------------------------------------------------------------
create function public.get_registry(code text)
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

grant execute on function public.get_registry(text) to anon, authenticated;

-- "I'll get this": returns a token the guest's browser keeps to undo it, or null if already taken.
create function public.reserve_gift(code text, product uuid, name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  w_id  uuid;
  token uuid;
begin
  select id into w_id from public.wishlists where share_code = code and kind = 'registry';
  if w_id is null or btrim(coalesce(name, '')) = '' then
    return null;
  end if;
  insert into public.gift_reservations (wishlist_id, product_id, guest_name)
  select w_id, product, left(btrim(name), 40)
  where exists (select 1 from public.wishlist_items where wishlist_id = w_id and product_id = product)
  on conflict do nothing
  returning cancel_token into token;
  return token;
end;
$$;

grant execute on function public.reserve_gift(text, uuid, text) to anon, authenticated;

-- Undo a reservation: only with the token the guest's browser got when reserving.
create function public.unreserve_gift(code text, product uuid, token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed int;
begin
  delete from public.gift_reservations r
  using public.wishlists w
  where w.share_code = code and r.wishlist_id = w.id and r.product_id = product and r.cancel_token = token;
  get diagnostics removed = row_count;
  return removed > 0;
end;
$$;

grant execute on function public.unreserve_gift(text, uuid, uuid) to anon, authenticated;

-- For the owner in surprise mode: how many gifts are taken, without saying which.
create function public.registry_taken_count(registry uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.gift_reservations r
  join public.wishlists w on w.id = r.wishlist_id
  where r.wishlist_id = registry and w.owner_id = auth.uid();
$$;

grant execute on function public.registry_taken_count(uuid) to authenticated;
