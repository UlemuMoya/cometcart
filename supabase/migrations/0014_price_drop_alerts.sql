-- Price-drop notifications: when a Discover product someone saved gets cheaper,
-- their phone gets a notification (sent once a day by /api/price-alerts).
-- Run once in the Supabase SQL Editor. The setup steps add one more line that
-- stores the alert key's fingerprint (not the key itself).

-------------------------------------------------------------------------------
-- The phones and browsers that allowed notifications. The endpoint is the
-- browser's own address for notifications; p256dh and auth encrypt them.
-------------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references public.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "People manage their own notification subscriptions" on public.push_subscriptions;
create policy "People manage their own notification subscriptions"
  on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Saving a browser's subscription. If someone else used this browser before,
-- it becomes yours (whoever holds the browser gets its notifications).
create or replace function public.save_push_subscription(sub_endpoint text, sub_p256dh text, sub_auth text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Please sign in';
  end if;
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth)
  values (sub_endpoint, auth.uid(), sub_p256dh, sub_auth)
  on conflict on constraint push_subscriptions_pkey do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;

revoke execute on function public.save_push_subscription(text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text) to authenticated;

-------------------------------------------------------------------------------
-- Price drops on Discover products, recorded whenever a price is saved lower
-- (by the owner, a shop's feed, or anyone adding a cheaper shop).
-- No policies: only the functions below read it.
-------------------------------------------------------------------------------
create table if not exists public.price_drops (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  shop_name  text not null,
  old_price  numeric(12, 2) not null,
  new_price  numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);

alter table public.price_drops enable row level security;

create or replace function public.record_price_drop()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  was numeric;
begin
  if not exists (select 1 from public.products where id = new.product_id and listed) then
    return null;
  end if;
  if tg_op = 'UPDATE' then
    -- A shop lowered its price.
    if new.price_zar < old.price_zar then
      insert into public.price_drops (product_id, shop_name, old_price, new_price)
      values (new.product_id, new.shop_name, old.price_zar, new.price_zar);
    end if;
  else
    -- A new shop is cheaper than every shop before it.
    select min(price_zar) into was from public.offers where product_id = new.product_id and id <> new.id;
    if was is not null and new.price_zar < was then
      insert into public.price_drops (product_id, shop_name, old_price, new_price)
      values (new.product_id, new.shop_name, was, new.price_zar);
    end if;
  end if;
  return null;
end;
$$;

revoke execute on function public.record_price_drop() from public, anon, authenticated;

drop trigger if exists offers_price_drop on public.offers;
create trigger offers_price_drop
  after insert or update of price_zar on public.offers
  for each row execute function public.record_price_drop();

-------------------------------------------------------------------------------
-- The daily sender proves itself with a key kept in Vercel. Only the key's
-- fingerprint (SHA-256) is stored here, in a schema the website can't read.
-------------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.alert_key (fingerprint text primary key);
alter table private.alert_key enable row level security; -- no policies: only alert_key_ok reads it

create or replace function private.alert_key_ok(key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.alert_key
    where fingerprint = encode(pg_catalog.sha256(convert_to(key, 'UTF8')), 'hex'));
$$;

-- The notifications due: one per phone per product, for the cheapest new price,
-- only to people who saved the product before it dropped, and only while that
-- price still stands. Marks the drops as sent.
create or replace function public.take_price_alerts(key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.alert_key_ok(key) then
    raise exception 'Not allowed';
  end if;

  with due as (
    update public.price_drops set sent_at = now()
    where sent_at is null
    returning product_id, shop_name, old_price, new_price, created_at
  ),
  still as (
    select d.* from due d
    where exists (select 1 from public.offers o
                  where o.product_id = d.product_id and o.shop_name = d.shop_name and o.price_zar = d.new_price)
  ),
  best as (
    select distinct on (product_id) * from still order by product_id, new_price, created_at desc
  ),
  savers as (
    select distinct w.owner_id, b.product_id, b.shop_name, b.old_price, b.new_price
    from best b
    join public.wishlist_items i on i.product_id = b.product_id and i.saved_at < b.created_at
    join public.wishlists w on w.id = i.wishlist_id and w.kind = 'wishlist'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth,
    'product_id', v.product_id, 'name', p.name, 'shop', v.shop_name,
    'old_price', v.old_price, 'new_price', v.new_price)), '[]'::jsonb)
  into result
  from savers v
  join public.push_subscriptions s on s.user_id = v.owner_id
  join public.products p on p.id = v.product_id;

  return result;
end;
$$;

-- A browser that no longer accepts notifications (uninstalled, or permission removed).
create or replace function public.forget_push_subscription(key text, sub_endpoint text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.alert_key_ok(key) then
    raise exception 'Not allowed';
  end if;
  delete from public.push_subscriptions s where s.endpoint = sub_endpoint;
end;
$$;

revoke execute on function public.take_price_alerts(text) from public;
revoke execute on function public.forget_push_subscription(text, text) from public;
grant execute on function public.take_price_alerts(text) to anon, authenticated;
grant execute on function public.forget_push_subscription(text, text) to anon, authenticated;
