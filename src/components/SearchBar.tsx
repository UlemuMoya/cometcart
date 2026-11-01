type Props = {
  placeholder?: string;
  defaultValue?: string;
};

// A plain form: works without JavaScript and sends people to Discover with ?q=
export function SearchBar({
  placeholder = "Search anything, in your own words",
  defaultValue,
}: Props) {
  return (
    <form action="/discover" role="search" className="my-4 flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label="Search"
        className="min-w-0 flex-1 rounded-[3px] border border-line bg-card px-4 py-[13px] placeholder:text-mute"
      />
      <button type="submit" className="btn-grad rounded-[3px] px-[18px] py-3 font-semibold">
        Search
      </button>
    </form>
  );
}
