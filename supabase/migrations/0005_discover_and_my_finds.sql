-- Discover shows only products the owner has approved ("listed"). Anything a
-- shopper adds from a link stays private in their own "My finds" until then.
-- Run once in the Supabase SQL Editor.

alter table public.products add column listed boolean not null default false;

-- The generic sample products are the Discover catalogue for now.
update public.products set listed = true
where description = 'Sample product for testing. Delete before launch.';

-- Everyone sees listed products; people also see their own finds.
drop policy "Anyone can browse products" on public.products;
create policy "Anyone can browse listed products, and their own finds"
  on public.products for select to anon, authenticated
  using (listed or (select auth.uid()) = added_by);

-- Shoppers can't list their own finds in Discover (the owner does that in Supabase).
drop policy "Signed-in people can add products as themselves" on public.products;
create policy "Signed-in people can add products as themselves"
  on public.products for insert to authenticated
  with check ((select auth.uid()) = added_by and not listed);

drop policy "People can edit products they added" on public.products;
create policy "People can edit products they added"
  on public.products for update to authenticated
  using ((select auth.uid()) = added_by and not listed)
  with check ((select auth.uid()) = added_by and not listed);

-- Prices (and their shop links) are only visible on products you can see.
drop policy "Anyone can see offers" on public.offers;
create policy "Anyone can see prices on products they can see"
  on public.offers for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

-- A shop's price can be added to any product you can see: a listed one, or your own find.
drop policy "Signed-in people can add a shop's price, as themselves" on public.offers;
create policy "Signed-in people can add a shop's price, as themselves"
  on public.offers for insert to authenticated
  with check (
    (select auth.uid()) = added_by
    and exists (select 1 from public.products p where p.id = product_id));
