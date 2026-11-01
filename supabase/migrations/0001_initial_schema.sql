-- Cometcart version 1 database: tables from CLAUDE.md plus row-level security.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Safe to read top to bottom: each table is followed by who may see or change it.

-------------------------------------------------------------------------------
-- users: one row per signed-up person, linked to Supabase's own auth.users.
-------------------------------------------------------------------------------
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  -- optional profile: { "sizes": "...", "budget": "...", "style": "..." }
  preferences jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read their own row"
  on public.users for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own row"
  on public.users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Create the users row automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-------------------------------------------------------------------------------
-- products: the shared catalogue. Anyone can browse; signed-in people can add.
-------------------------------------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null check (category in (
                'Tops','Pants','Shoes','Bags','Furniture','Bedding','Lighting','Kitchen',
                'Makeup','Skincare','Fragrance','Headphones','Laptops','TVs','Watches','Appliances')),
  image       text,
  description text,
  added_by    uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Anyone can browse products"
  on public.products for select to anon, authenticated
  using (true);

create policy "Signed-in people can add products as themselves"
  on public.products for insert to authenticated
  with check ((select auth.uid()) = added_by);

create policy "People can edit products they added"
  on public.products for update to authenticated
  using ((select auth.uid()) = added_by)
  with check ((select auth.uid()) = added_by);

create policy "People can delete products they added"
  on public.products for delete to authenticated
  using ((select auth.uid()) = added_by);

-------------------------------------------------------------------------------
-- offers: a product's price at one shop. The ONLY place shop links are stored,
-- so they can later be swapped for affiliate links without a rebuild.
-------------------------------------------------------------------------------
create table public.offers (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products (id) on delete cascade,
  shop_name        text not null,
  price_zar        numeric(12, 2) not null check (price_zar > 0),
  url              text not null,
  price_checked_at timestamptz not null default now()
);

create index offers_product_id_idx on public.offers (product_id);

alter table public.offers enable row level security;

create policy "Anyone can see offers"
  on public.offers for select to anon, authenticated
  using (true);

create policy "People can add offers to products they added"
  on public.offers for insert to authenticated
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.added_by = (select auth.uid())));

create policy "People can edit offers on products they added"
  on public.offers for update to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.added_by = (select auth.uid())));

create policy "People can delete offers on products they added"
  on public.offers for delete to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.added_by = (select auth.uid())));

-------------------------------------------------------------------------------
-- wishlists: private unless the owner makes them public or shares the link.
-------------------------------------------------------------------------------
create table public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.users (id) on delete cascade,
  name       text not null default 'My wishlist',
  is_public  boolean not null default false,
  share_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  created_at timestamptz not null default now()
);

create index wishlists_owner_id_idx on public.wishlists (owner_id);

alter table public.wishlists enable row level security;

create policy "Owners manage their wishlists"
  on public.wishlists for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Anyone can read public wishlists"
  on public.wishlists for select to anon, authenticated
  using (is_public);

-------------------------------------------------------------------------------
-- wishlist_items: products saved to a wishlist.
-------------------------------------------------------------------------------
create table public.wishlist_items (
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  saved_at    timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);

alter table public.wishlist_items enable row level security;

create policy "Owners manage items in their wishlists"
  on public.wishlist_items for all to authenticated
  using (exists (
    select 1 from public.wishlists w
    where w.id = wishlist_id and w.owner_id = (select auth.uid())))
  with check (exists (
    select 1 from public.wishlists w
    where w.id = wishlist_id and w.owner_id = (select auth.uid())));

create policy "Anyone can read items in public wishlists"
  on public.wishlist_items for select to anon, authenticated
  using (exists (
    select 1 from public.wishlists w
    where w.id = wishlist_id and w.is_public));

-- Private-but-shared wishlists: readable only by someone who has the share code.
-- A function is used because a security rule can't see the code in the link.
create function public.get_shared_wishlist(code text)
returns table (
  wishlist_id   uuid,
  wishlist_name text,
  product_id    uuid,
  saved_at      timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select w.id, w.name, i.product_id, i.saved_at
  from public.wishlists w
  left join public.wishlist_items i on i.wishlist_id = w.id
  where w.share_code = code;
$$;

grant execute on function public.get_shared_wishlist(text) to anon, authenticated;

-------------------------------------------------------------------------------
-- link_clicks: counts "Visit shop" clicks. Anyone can log a click; nobody can
-- read clicks from the website (only from the Supabase dashboard).
-------------------------------------------------------------------------------
create table public.link_clicks (
  id         bigint generated always as identity primary key,
  product_id uuid not null references public.products (id) on delete cascade,
  offer_id   uuid not null references public.offers (id) on delete cascade,
  user_id    uuid references public.users (id) on delete set null,
  clicked_at timestamptz not null default now()
);

alter table public.link_clicks enable row level security;

create policy "Anyone can log a click, only as themselves"
  on public.link_clicks for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
