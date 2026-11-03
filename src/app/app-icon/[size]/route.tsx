import { ImageResponse } from "next/og";

// PNG app icons: 192px and 512px for Chrome's "Install app", 180px for iPhone home screens.
const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#19d68f"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="512" height="512" fill="#050b24"/><circle cx="256" cy="256" r="120" fill="url(#g)"/><ellipse cx="256" cy="262" rx="190" ry="44" fill="none" stroke="#5eead4" stroke-width="22" transform="rotate(-20 256 262)"/></svg>`;
const SRC = `data:image/svg+xml;base64,${Buffer.from(ICON).toString("base64")}`;

export async function GET(_request: Request, ctx: RouteContext<"/app-icon/[size]">) {
  const { size } = await ctx.params;
  const px = size === "512" ? 512 : size === "180" ? 180 : 192;
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- rendered to a PNG, not shown in a page
    <img src={SRC} width={px} height={px} alt="" />,
    { width: px, height: px },
  );
}
