-- Shops that list with Cometcart (pay-per-click, step 1: free listing).
-- Shops apply on "List your shop"; the owner approves them, imports the product
-- feeds they send, and sees how many "Visit shop" clicks each shop gets.
-- Run once in the Supabase SQL Editor.

create table public.shops (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 80),
  website          text not null check (char_length(website) <= 200),
  contact_name     text not null check (char_length(contact_name) <= 120),
  contact_email    text not null check (char_length(contact_email) <= 200),
  phone            text check (char_length(phone) <= 40),
  message          text check (char_length(message) <= 2000),
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- Set by the owner once the shop has agreed in writing that Cometcart may show its product photos.
  photo_permission boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.shops enable row level security;

-- Anyone may apply. Applications always start as pending, without photo permission.
create policy "Anyone can apply to list a shop"
  on public.shops for insert to anon, authenticated
  with check (status = 'pending' and not photo_permission);

-- Only the owner can see applications (they hold contact details) and change them.
create policy "Owners can see shops"
  on public.shops for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Owners can update shops"
  on public.shops for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

create policy "Owners can delete shops"
  on public.shops for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- Which listed shop a price came from (for click reports and, later, billing).
alter table public.offers add column shop_id uuid references public.shops (id) on delete set null;

-------------------------------------------------------------------------------
-- Import a shop's product feed (owner only). Each row: name, category, price, url, image.
-- A row whose link is already on Cometcart updates that price. Otherwise it joins a
-- Discover product with the same name and category, or becomes a new Discover product.
-------------------------------------------------------------------------------
create function public.import_shop_feed(shop uuid, rows jsonb)
returns table (added_products int, added_prices int, updated_prices int, skipped int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  s        public.shops%rowtype;
  r        jsonb;
  p_id     uuid;
  o_id     uuid;
  v_name   text;
  v_cat    text;
  v_url    text;
  v_img    text;
  v_price  numeric;
  n_prod   int := 0;
  n_new    int := 0;
  n_upd    int := 0;
  n_skip   int := 0;
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Only the site owner can import feeds';
  end if;
  select * into s from public.shops where id = shop and status = 'approved';
  if not found then
    raise exception 'That shop is not approved';
  end if;

  for r in select * from jsonb_array_elements(rows) loop
    v_name  := btrim(r ->> 'name');
    v_cat   := r ->> 'category';
    v_url   := r ->> 'url';
    v_img   := case when s.photo_permission then nullif(r ->> 'image', '') end;
    v_price := (r ->> 'price')::numeric;
    if v_name is null or v_name = '' or v_url is null or v_price is null or v_price <= 0 then
      n_skip := n_skip + 1;
      continue;
    end if;

    select id into o_id from public.offers where url = v_url limit 1;
    if found then
      update public.offers
      set price_zar = v_price, price_checked_at = now(), shop_name = s.name, shop_id = s.id
      where id = o_id;
      n_upd := n_upd + 1;
      continue;
    end if;

    select id into p_id from public.products
    where listed and lower(name) = lower(v_name) and category = v_cat
    limit 1;
    if not found then
      insert into public.products (name, category, image, added_by, listed)
      values (v_name, v_cat, v_img, auth.uid(), true)
      returning id into p_id;
      n_prod := n_prod + 1;
    elsif v_img is not null then
      update public.products set image = coalesce(image, v_img) where id = p_id;
    end if;

    insert into public.offers (product_id, shop_name, price_zar, url, added_by, shop_id)
    values (p_id, s.name, v_price, v_url, auth.uid(), s.id);
    n_new := n_new + 1;
  end loop;

  return query select n_prod, n_new, n_upd, n_skip;
end;
$$;

revoke execute on function public.import_shop_feed(uuid, jsonb) from public, anon;
grant execute on function public.import_shop_feed(uuid, jsonb) to authenticated;

-------------------------------------------------------------------------------
-- "Visit shop" clicks per shop per month (owner only). Counts only, never who clicked.
-------------------------------------------------------------------------------
create function public.shop_click_report(last_months int default 3)
returns table (shop text, month date, clicks bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Only the site owner can see click reports';
  end if;
  return query
    select o.shop_name, date_trunc('month', k.clicked_at)::date, count(*)
    from public.link_clicks k
    join public.offers o on o.id = k.offer_id
    where k.clicked_at >= date_trunc('month', now()) - make_interval(months => greatest(last_months, 1) - 1)
    group by 1, 2
    order by 2 desc, 3 desc;
end;
$$;

revoke execute on function public.shop_click_report(int) from public, anon;
grant execute on function public.shop_click_report(int) to authenticated;
