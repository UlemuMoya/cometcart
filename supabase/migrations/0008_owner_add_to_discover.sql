-- "Add to Discover": lets the site owner move one of their own finds into
-- Discover (or take it back out). Owners are listed in public.admins, which
-- can only be changed here in the SQL Editor, never from the website.
-- Run once in the Supabase SQL Editor.

create table public.admins (
  user_id uuid primary key references public.users (id) on delete cascade
);

alter table public.admins enable row level security;

-- People can check whether they themselves are an owner; nobody can add or remove rows from the website.
create policy "People can see whether they are an owner"
  on public.admins for select to authenticated
  using ((select auth.uid()) = user_id);

-- Shows or hides one of the owner's own products in Discover. Only their own,
-- so other shoppers' private finds are never made public.
create function public.set_listed(product uuid, show boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Only the site owner can change Discover';
  end if;
  update public.products set listed = show
  where id = product and added_by = auth.uid();
end;
$$;

revoke execute on function public.set_listed(uuid, boolean) from public, anon;
grant execute on function public.set_listed(uuid, boolean) to authenticated;

-- Then make yourself an owner (use the email you sign in with):
--   insert into public.admins (user_id)
--   select id from public.users where email = 'you@example.com';
