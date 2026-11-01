-- Comparisons need many shops' prices on one product, so any signed-in person
-- can add a shop's price (offer) to any product. People can still only change
-- or remove the prices they added themselves.
-- Run once in the Supabase SQL Editor.

alter table public.offers
  add column added_by uuid references public.users (id) on delete set null default auth.uid();

-- Existing prices belong to whoever added the product.
update public.offers o set added_by = p.added_by
from public.products p
where p.id = o.product_id and o.added_by is null;

drop policy "People can add offers to products they added" on public.offers;
drop policy "People can edit offers on products they added" on public.offers;
drop policy "People can delete offers on products they added" on public.offers;

create policy "Signed-in people can add a shop's price, as themselves"
  on public.offers for insert to authenticated
  with check ((select auth.uid()) = added_by);

create policy "People can edit prices they added"
  on public.offers for update to authenticated
  using ((select auth.uid()) = added_by)
  with check ((select auth.uid()) = added_by);

create policy "People can delete prices they added"
  on public.offers for delete to authenticated
  using ((select auth.uid()) = added_by);
