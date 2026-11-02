-- "Trending finds" on the home page: Discover products people saved to a
-- wishlist or clicked "Visit shop" on recently. Returns only product ids and a
-- score, never who saved or clicked, so it's safe for anyone to call.
-- Run once in the Supabase SQL Editor.

create function public.trending_products(within_days int default 30, max_count int default 12)
returns table (product_id uuid, score bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(s.n, 0) * 2 + coalesce(c.n, 0) as score
  from public.products p
  left join (
    select i.product_id, count(*) as n
    from public.wishlist_items i
    where i.saved_at > now() - make_interval(days => within_days)
    group by i.product_id
  ) s on s.product_id = p.id
  left join (
    select k.product_id, count(*) as n
    from public.link_clicks k
    where k.clicked_at > now() - make_interval(days => within_days)
    group by k.product_id
  ) c on c.product_id = p.id
  where p.listed and (s.n is not null or c.n is not null)
  order by score desc
  limit least(max_count, 50);
$$;

grant execute on function public.trending_products(int, int) to anon, authenticated;
