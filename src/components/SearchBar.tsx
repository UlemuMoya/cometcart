import { CATEGORIES } from "@/lib/categories";

type Props = {
  placeholder?: string;
  defaultValue?: string;
};

// Suggested as people type (the browser's own suggestion list, so it works everywhere).
const SUGGESTIONS = [...CATEGORIES, "air fryer under R1500", "wireless headphones", "55-inch TV"];

// A plain form: works without JavaScript and sends people to Discover with ?q=
export function SearchBar({
  placeholder = "Search any product in your own words",
  defaultValue,
}: Props) {
  return (
    <form action="/discover" role="search" className="my-4 flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label="Search for a product"
        list="home-search-suggestions"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-[3px] border border-line bg-card px-4 py-[13px] placeholder:text-mute"
      />
      <datalist id="home-search-suggestions">
        {SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <button type="submit" className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold">
        Search
      </button>
    </form>
  );
}
