# Cometcart: project brief for Claude Code

@AGENTS.md

## Who you are working with
The owner is not a developer. Explain what you are doing in plain language, work in small steps, run the app after each step so they can see it, and commit to git often with clear messages. Ask before adding any paid service. Never put secrets (API keys, passwords) in code or commit them; use environment variables and a `.env.example` file.

## What we are building
Cometcart is a website (mobile-friendly, installable on a phone home screen) for South African shoppers. Tagline: "Find anything. Compare every price. Save what you love."

People search in their own words or upload a photo, see the same product at different shops with the lowest price marked, and save products to wishlists they can share by link. Version 1 sends people to retailers with plain product links. Affiliate tracking comes later, so every shop link must be stored in one place (the `offers` table) so it can be swapped for a tracked link without a rebuild.

Reference design: `reference/cometcart-prototype.html` is a clickable prototype (git-ignored because its photos are unlicensed). Match its layout, behaviour, wording and look. Use it as the source of truth for screens and copy.

## Suggested stack (you may propose better, with reasons)
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase for Postgres database, sign-in and image storage
- Anthropic API for the shopping assistant and photo search, called only from server code
- Hosting on Vercel (free tier to start)

## Look and feel
- Dark "night sky" theme throughout: deep navy base (about #050b24), cards (#0c1745), soft blue lines (#1c2f72).
- Comet and aurora accents: teal-green (#5eead4), electric blue, violet and pink. Buttons and selected tabs use a gradient from #0b7f68 through #4a3fd0 to #8a2fc0 with white text.
- Fonts: Cormorant Garamond for headings, DM Sans for body, Allura only for rare handwritten accents.
- Home screen: a starry aurora masthead with the headline and one-line description, a search bar, inspiration tiles with photos, trending finds, saved collections, and an always-available assistant button.
- Use plain, generic category names: Tops, Pants, Shoes, Bags, Furniture, Bedding, Lighting, Kitchen, Makeup, Skincare, Fragrance, Headphones, Laptops, TVs, Watches, Appliances.
- Respect "reduce motion" settings. Keep text readable (good contrast) and make everything work with a keyboard.

## Screens
1. Sign in / sign up (email). Optional profile: sizes, budget, style.
2. Home (see above).
3. Discover: search results with category filters and a result count. Understand budgets such as "under R500". If nothing fits the budget, show the closest options and say so.
4. Product page: photo, price at each shop with the date checked, lowest price marked, "Visit shop" links, review summary (real, sourced reviews only), "Save to wishlist".
5. Wishlist: saved items, share link, public or private, rename, delete.
6. Shared wishlist: read-only page anyone can open from a link.
7. Add a product: paste a link, then enter name, shop, price, category, optional photo.
8. Assistant: floating chat. Recommends only products that exist in the catalogue. Never invents products, prices or reviews. If nothing fits, says so.
9. Photo search: upload a photo, identify buyable items in it, match each to catalogue products.

## Data model (version 1)
- `users`: id, email, name, created_at, optional preferences
- `products`: id, name, category, image, description, added_by
- `offers`: product_id, shop_name, price_zar, url, price_checked_at
- `wishlists`: id, owner_id, name, is_public, share_code
- `wishlist_items`: wishlist_id, product_id, saved_at
- `link_clicks`: product_id, offer_id, user_id (nullable), clicked_at

Use row-level security so people can only edit their own data, and shared lists are readable only via their share code or if public.

## Rules the product must follow
- Prices always show the shop and the date they were checked.
- Wishlists are private unless the owner makes them public or shares the link.
- Comply with South Africa's POPIA for personal data and uploaded images. Do not keep uploaded photos longer than needed for photo search.
- No fake reviews and no invented product facts.
- Any sponsored placement added later must be clearly labelled and kept separate from organic results.
- Product photos in the prototype are temporary placeholders and may not be licensed. Do not ship them. Use photos the owner supplies with a recorded licence, or photos users upload.
- Do not scrape retailer websites. Product data comes from users adding links, partner feeds, or affiliate APIs.

## Build order (finish and show each step before the next)
1. Project setup, git, the dark theme, and the home screen with placeholder data. Show it running.
2. Accounts and the database tables above.
3. Add a product, product pages, and Discover search over real stored products.
4. Wishlists and the shareable wishlist page.
5. Replace home placeholder content with real products and hand-picked inspiration tiles.
6. The assistant using the Anthropic API (server side only), limited to catalogue products.
7. Photo search.
8. Later: registries with reserve-a-gift, group gifting, affiliate links, price history, premium features.

## First task
Read `cometcart-prototype.html` and this file, then propose a short plan for step 1 in plain language. Wait for the owner's approval before writing code.

## Still to decide (ask the owner when relevant)
- Final name check: CIPC company name search, trademark search (classes 35, 9, 42), social handles. Domain: cometcart.co.za looked available. Backup name: Findaway.
- First 3 to 5 retailers to feature, and whether their data may be shown.
- Monthly budget for hosting and AI usage.
