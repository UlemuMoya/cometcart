// Tries the link guesser on sample shop addresses.
// Run: node scripts/try-link-guess.ts
import { guessFromLink, resolveShopLink } from "../src/lib/link-guess.ts";

const links = [
  "https://www.takealot.com/black-leather-handbag/PLID90123456",
  "https://www.woolworths.co.za/prod/Home-Kitchen/Bedding/Linen-Duvet-Cover-Set/_/A-6009219123456",
  "https://www.superbalist.com/women/shoes/sneakers/white-leather-sneakers/1234567",
  "https://www.makro.co.za/appliances/small-appliances/air-fryers/defy-4l-air-fryer/p/000000000000412345_EA",
  "https://m.takealot.com/sony-wh-1000xm5-wireless-headphones/PLID73456789",
  "https://www.mrphome.com/en_za/stoneware-dinner-set-12-piece-1234567.html",
  "https://www.incredible.co.za/apple-macbook-air-13-inch-laptop",
  "https://shop.example.co.za/p/12345",
  "https://bash.com/women-s-steve-madden-red-briggy-tote-handbag-385000abiv6/p",
  // Google Shopping ad link with the shop link inside
  "https://www.google.com/aclk?sa=l&ai=DChcSE&ae=2&adurl=https%3A%2F%2Fwww.stevemadden.co.za%2Fproducts%2Fbtote-black-tote-bag%3Fvariant%3D123&ved=2ah",
  // Google redirect
  "https://www.google.com/url?q=https://www.takealot.com/air-fryer-5l/PLID111222333&sa=U",
  // Facebook outbound link
  "https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.woolworths.co.za%2Fprod%2Fwomen%2Fknit-jumper%2F_%2FA-500&h=AT0",
  // Plain Google search: no shop inside
  "https://www.google.com/search?q=black+bag",
  "https://share.google/AbCdEf123",
];

for (const l of links) {
  const r = resolveShopLink(l);
  console.log(r?.ok ? `${r.unwrapped ? "UNWRAPPED " : ""}${JSON.stringify(guessFromLink(l))}` : `PROBLEM: ${r?.problem}`);
  console.log("   ←", l.slice(0, 90));
}
