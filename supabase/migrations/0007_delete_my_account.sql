-- "Delete my account" (POPIA: people may ask for their personal data to be deleted).
-- Removes the person's sign-in, profile, wishlists and private finds. Shop prices
-- they added to Discover products stay, without their name, because other shoppers
-- rely on them for comparisons.
-- Run once in the Supabase SQL Editor.

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  -- Their private finds (and those finds' prices).
  delete from public.products where added_by = me and not listed;

  -- Their sign-in. This also removes their profile, wishlists and saved items;
  -- anything else they added keeps no link back to them.
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
