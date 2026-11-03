import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy · Cometcart",
  description: "What personal information Cometcart keeps, why, and your rights under POPIA.",
};

// Who is responsible for personal information (POPIA "responsible party" and Information Officer).
// Fill these in before publishing.
const RESPONSIBLE = "Ulemu Moya";
const CONTACT_EMAIL = "[privacy contact email]";
const UPDATED = "3 November 2026";

const h2 = "sec-title !text-2xl";
const p = "mb-3 max-w-[720px] text-[#dcd6ff]";
const ul = "mb-3 max-w-[720px] list-disc pl-5 text-[#dcd6ff] [&>li]:mb-1.5";

export default function PrivacyPage() {
  return (
    <article className="mt-[26px]">
      <h1 className="mb-2 font-display text-[clamp(34px,6vw,52px)] font-medium leading-[1.05]">Privacy policy</h1>
      <p className="mb-6 text-sm text-mute">Last updated {UPDATED}</p>

      <p className={p}>
        Cometcart helps you find products, compare prices at South African shops and keep wishlists. This page
        explains, in plain language, what personal information we keep, why, who helps us store it, and your
        rights under South Africa’s Protection of Personal Information Act (POPIA).
      </p>

      <h2 className={h2}>Who is responsible</h2>
      <p className={p}>
        Cometcart is run by {RESPONSIBLE}, the “responsible party” for your personal information. Our Information
        Officer can be reached at <strong>{CONTACT_EMAIL}</strong>.
      </p>

      <h2 className={h2}>What we keep</h2>
      <p className={p}>You can browse Discover without an account. If you create one, we keep:</p>
      <ul className={ul}>
        <li>
          <strong>Your account:</strong> your email address and password. Your password is stored scrambled
          (hashed), so nobody at Cometcart can read it.
        </li>
        <li>
          <strong>Your profile, if you fill it in:</strong> your name, sizes, budget and style. All optional.
        </li>
        <li>
          <strong>Your wishlist:</strong> the products you save, its name, and whether it’s public or private.
        </li>
        <li>
          <strong>Products and prices you add:</strong> the shop link, shop name, price, product name, category,
          and any photo you upload.
        </li>
        <li>
          <strong>“Visit shop” clicks:</strong> which product and shop you clicked through to, and when. If you’re
          signed in, the click is linked to your account.
        </li>
      </ul>
      <p className={p}>
        We don’t sell your information, show you ads, or use analytics or advertising trackers.
      </p>

      <h2 className={h2}>Why we keep it</h2>
      <ul className={ul}>
        <li>To run your account and let you sign in, reset your password and keep your wishlist.</li>
        <li>To show the products and prices you add, so you (and, for Discover products, other shoppers) can compare.</li>
        <li>
          To count “Visit shop” clicks and saves, so we can show what’s trending and learn which shops matter to
          shoppers. Trending only uses totals, never who saved or clicked.
        </li>
        <li>To keep Cometcart secure and working properly.</li>
      </ul>
      <p className={p}>
        We only use your information for these purposes. We rely on your consent when you sign up and add
        information, and on what’s needed to provide the service you asked for.
      </p>

      <h2 className={h2}>Photos you upload</h2>
      <p className={p}>
        When you add a photo, your phone or browser shrinks it first, which also removes hidden details such as
        your location. You confirm you took the photo or have the right to use it. Photos on your private products
        are deleted when you remove that product or delete your account.
      </p>

      <h2 className={h2}>Who can see it</h2>
      <ul className={ul}>
        <li>
          <strong>Your wishlist</strong> is private unless you make it public or share its link. Anyone with the
          link can view it, but not change it. You can make a new link at any time, which stops old links working.
          Products you added from shop links stay private even on a shared list.
        </li>
        <li>
          <strong>Products you add</strong> are only visible to you, unless Cometcart adds a product to Discover.
          Shop prices you add to a Discover product are visible to everyone, without your name.
        </li>
      </ul>

      <h2 className={h2}>Who helps us store it</h2>
      <p className={p}>We use trusted service providers (“operators”) who may only use your information to help run Cometcart:</p>
      <ul className={ul}>
        <li>
          <strong>Supabase</strong> stores our database, sign-in details and photos, and sends our account emails.
        </li>
        <li>
          <strong>Vercel</strong> hosts the website. Like most websites, its servers briefly log technical details
          such as your IP address to deliver pages and stop abuse.
        </li>
      </ul>
      <p className={p}>
        These providers may store or process information on servers outside South Africa. We only use providers
        bound by data-protection terms that give your information protection similar to POPIA.
      </p>

      <h2 className={h2}>Cookies</h2>
      <p className={p}>
        We only use the cookies needed to keep you signed in. We don’t use advertising or tracking cookies. When you
        click “Visit shop”, you go to the shop’s own website, which has its own privacy policy and cookies.
      </p>

      <h2 className={h2}>How long we keep it</h2>
      <p className={p}>
        We keep your account information until you delete your account. When you do, we delete your sign-in,
        profile, wishlist, private products and their photos. Shop prices you added to Discover products, and click
        counts, stay so comparisons and totals still work, but they’re no longer linked to you.
      </p>

      <h2 className={h2}>Your rights</h2>
      <p className={p}>Under POPIA you may:</p>
      <ul className={ul}>
        <li>ask what personal information we hold about you, and get a copy of it;</li>
        <li>correct it: you can edit your profile on your Account page;</li>
        <li>
          delete it: use <strong>Delete my account</strong> on your{" "}
          <Link href="/account" className="text-acc underline">
            Account
          </Link>{" "}
          page, or ask us;
        </li>
        <li>object to how we use it, or withdraw your consent;</li>
        <li>
          complain to the{" "}
          <a href="https://inforegulator.org.za" target="_blank" rel="noopener" className="text-acc underline">
            Information Regulator (South Africa)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          if you’re unhappy with how we handle your information.
        </li>
      </ul>
      <p className={p}>
        For anything on this page, email <strong>{CONTACT_EMAIL}</strong>. We’ll reply as soon as we can, and within
        30 days.
      </p>

      <h2 className={h2}>Security</h2>
      <p className={p}>
        All traffic to Cometcart is encrypted (https). Database rules make sure people can only see and change
        their own information. If we ever learn of a data breach that affects you, we’ll tell you and the
        Information Regulator as POPIA requires.
      </p>

      <h2 className={h2}>Children</h2>
      <p className={p}>Cometcart accounts are for people aged 18 and over.</p>

      <h2 className={h2}>Changes</h2>
      <p className={p}>
        If we change how we use personal information, for example when we add new features, we’ll update this page
        and its date. For important changes, we’ll tell signed-up shoppers by email.
      </p>
    </article>
  );
}
