import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
import { ShopApplyForm } from "@/components/ShopForms";

export const metadata: Metadata = {
  title: "List your shop",
  description: "Show your products and prices to South African shoppers comparing prices on Cometcart.",
};

const p = "mb-3 max-w-[640px] text-[#dcd6ff]";

export default function ListYourShopPage() {
  return (
    <section>
      <PageIntro
        title="List your shop"
        intro="Show your products and prices to South African shoppers who are ready to buy."
      />

      <h2 className="sec-title !mt-2 !text-2xl">How it works</h2>
      <ol className="mb-6 max-w-[640px] list-decimal pl-5 text-[#dcd6ff] [&>li]:mb-2">
        <li>Apply below. We’ll reply by email.</li>
        <li>
          Send us your product list as a simple spreadsheet (CSV) with each product’s name, category, price, link and
          photo.{" "}
          <a href="/feed-template.csv" download className="text-acc underline">
            Download the template
          </a>
          .
        </li>
        <li>
          Your products appear in Discover, compared with other shops. Every “Visit shop” click goes straight to your
          product page.
        </li>
        <li>We send you a monthly report of how many shoppers we sent your way.</li>
      </ol>
      <p className={p}>
        <strong>Listing is free while Cometcart grows.</strong> Later we plan to charge a small, clearly agreed fee per
        click. We’ll always ask before any charges start, and you can leave at any time.
      </p>
      <p className={`${p} mb-6`}>
        Prices are always sorted from lowest to highest. Paying never changes where a shop appears in a comparison.
      </p>

      <h2 className="sec-title !text-2xl">Apply</h2>
      <ShopApplyForm />
    </section>
  );
}
