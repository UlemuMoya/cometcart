// Tries the link guesser on sample shop addresses.
// Run: node scripts/try-link-guess.ts
import { guessFromLink } from "../src/lib/link-guess.ts";

const links = [
  "https://www.takealot.com/black-leather-handbag/PLID90123456",
  "https://www.woolworths.co.za/prod/Home-Kitchen/Bedding/Linen-Duvet-Cover-Set/_/A-6009219123456",
  "https://www.superbalist.com/women/shoes/sneakers/white-leather-sneakers/1234567",
  "https://www.makro.co.za/appliances/small-appliances/air-fryers/defy-4l-air-fryer/p/000000000000412345_EA",
  "https://m.takealot.com/sony-wh-1000xm5-wireless-headphones/PLID73456789",
  "https://www.mrphome.com/en_za/stoneware-dinner-set-12-piece-1234567.html",
  "https://www.incredible.co.za/apple-macbook-air-13-inch-laptop",
  "https://shop.example.co.za/p/12345",
];

for (const l of links) console.log(JSON.stringify(guessFromLink(l)), "\n   ←", l);
