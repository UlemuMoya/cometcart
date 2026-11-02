-- Lets the site owner fix the name or category of a product in Discover.
-- (Shoppers edit their own private products through the normal rules.)
-- Run once in the Supabase SQL Editor.

create function public.update_listed_product(product uuid, new_name text, new_category text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Only the site owner can edit Discover products';
  end if;
  update public.products set name = new_name, category = new_category
  where id = product and listed;
end;
$$;

revoke execute on function public.update_listed_product(uuid, text, text) from public, anon;
grant execute on function public.update_listed_product(uuid, text, text) to authenticated;
