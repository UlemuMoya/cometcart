// A coloured square with the shop's first letter. Not the shop's real logo: that needs the shop's permission.

const COLOURS = ["#0b6fd6", "#0f8a4a", "#7c3aed", "#b45309", "#be185d", "#0e7490", "#4338ca", "#475569"];

function colourFor(name: string): string {
  let h = 0;
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLOURS[h % COLOURS.length];
}

export function ShopBadge({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 flex-none place-items-center rounded-[8px] text-[15px] font-bold text-white"
      style={{ background: colourFor(name) }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
