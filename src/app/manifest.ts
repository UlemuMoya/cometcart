import type { MetadataRoute } from "next";

// Lets people add Cometcart to their phone's home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cometcart",
    short_name: "Cometcart",
    description: "Find anything. Compare every price. Save what you love.",
    start_url: "/",
    display: "standalone",
    background_color: "#050b24",
    theme_color: "#050b24",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
