-- TEST PRODUCTS for trying out Discover and product pages. NOT real products,
-- shops or prices. Shop names end in "(sample)" and links go to example.com.
-- Run in Supabase: SQL Editor > New query > paste > Run.
-- Remove them all before launch with:
--   delete from public.products where description like 'Sample product%';
-- Safe to run more than once: it clears old test products first, so they never double up.

delete from public.products where description like 'Sample product%';

with new_products as (
  insert into public.products (name, category, image, description) values
    ('Black leather handbag',           'Bags',       '/images/handbag.jpg',    'Sample product for testing. Delete before launch.'),
    ('Canvas crossbody bag',            'Bags',       null,                     'Sample product for testing. Delete before launch.'),
    ('White leather sneakers',          'Shoes',      '/images/sneakers.jpg',   'Sample product for testing. Delete before launch.'),
    ('Linen bedding set (queen)',       'Bedding',    '/images/bedding.jpg',    'Sample product for testing. Delete before launch.'),
    ('White dome table lamp',           'Lighting',   '/images/lamp.jpg',       'Sample product for testing. Delete before launch.'),
    ('Stoneware dinner set (12 piece)', 'Kitchen',    '/images/dinnerware.jpg', 'Sample product for testing. Delete before launch.'),
    ('Wooden armchair with cushion',    'Furniture',  '/images/armchair.jpg',   'Sample product for testing. Delete before launch.'),
    ('Relaxed crew-neck top',           'Tops',       '/images/top.jpg',        'Sample product for testing. Delete before launch.'),
    ('Wide-leg cropped jeans',          'Pants',      '/images/jeans.jpg',      'Sample product for testing. Delete before launch.'),
    ('Wireless over-ear headphones',    'Headphones', '/images/headphones.jpg', 'Sample product for testing. Delete before launch.'),
    ('Air fryer (4-litre)',             'Appliances', '/images/air-fryer.jpg',  'Sample product for testing. Delete before launch.'),
    ('Eau de parfum (50 ml)',           'Fragrance',  '/images/perfume.jpg',    'Sample product for testing. Delete before launch.'),
    ('Face serum (30 ml)',              'Skincare',   '/images/serum.jpg',      'Sample product for testing. Delete before launch.'),
    ('Smartwatch',                      'Watches',    '/images/smartwatch.jpg', 'Sample product for testing. Delete before launch.')
  returning id, name
)
insert into public.offers (product_id, shop_name, price_zar, url)
select p.id, o.shop || ' (sample)', o.price, 'https://example.com/sample-product'
from new_products p
join (values
  ('Black leather handbag', 'Nova Mart', 1399), ('Black leather handbag', 'Lumi Store', 1299), ('Black leather handbag', 'Orbit Fashion', 1549),
  ('Canvas crossbody bag', 'Nova Mart', 349), ('Canvas crossbody bag', 'Lumi Store', 399),
  ('White leather sneakers', 'Orbit Fashion', 849), ('White leather sneakers', 'Nova Mart', 799), ('White leather sneakers', 'Stride House', 899),
  ('Linen bedding set (queen)', 'Haven Home', 1799), ('Linen bedding set (queen)', 'Nova Mart', 1899), ('Linen bedding set (queen)', 'Casa Mode', 1699),
  ('White dome table lamp', 'Casa Mode', 649), ('White dome table lamp', 'Haven Home', 699),
  ('Stoneware dinner set (12 piece)', 'Casa Mode', 1299), ('Stoneware dinner set (12 piece)', 'Nova Mart', 1349),
  ('Wooden armchair with cushion', 'Haven Home', 3299), ('Wooden armchair with cushion', 'Casa Mode', 3499),
  ('Relaxed crew-neck top', 'Nova Mart', 199), ('Relaxed crew-neck top', 'Lumi Store', 229),
  ('Wide-leg cropped jeans', 'Nova Mart', 599), ('Wide-leg cropped jeans', 'Stride House', 649),
  ('Wireless over-ear headphones', 'Nova Mart', 1299), ('Wireless over-ear headphones', 'Circuit Hub', 1399),
  ('Air fryer (4-litre)', 'Haven Home', 1099), ('Air fryer (4-litre)', 'Nova Mart', 1199),
  ('Eau de parfum (50 ml)', 'Glow Counter', 1299), ('Eau de parfum (50 ml)', 'Lumi Store', 1399),
  ('Face serum (30 ml)', 'Glow Counter', 449), ('Face serum (30 ml)', 'Lumi Store', 479),
  ('Smartwatch', 'Circuit Hub', 2499), ('Smartwatch', 'Nova Mart', 2699)
) as o(name, shop, price) on o.name = p.name;
