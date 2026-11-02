-- Owner tools for Discover: take any product out of Discover, and change a
-- Discover product's photo. Shoppers can't do either; their own (private)
-- products they edit through the normal rules.
-- Run once in the Supabase SQL Editor.

-- Adding to Discover: still only the owner's own products, so nobody's private
-- product is ever made public. Removing: any product in Discover.
create or replace function public.set_listed(product uuid, show boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Only the site owner can change Discover';
  end if;
  if show then
    update public.products set listed = true where id = product and added_by = auth.uid();
  else
    update public.products set listed = false where id = product and listed;
  end if;
end;
$$;

create function public.set_product_image(product uuid, new_image text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Only the site owner can change Discover photos';
  end if;
  update public.products set image = new_image where id = product and listed;
end;
$$;

revoke execute on function public.set_product_image(uuid, text) from public, anon;
grant execute on function public.set_product_image(uuid, text) to authenticated;
