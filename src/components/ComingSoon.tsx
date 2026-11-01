import Link from "next/link";

type Props = {
  title: string;
  intro: string;
  when: string;
};

export function ComingSoon({ title, intro, when }: Props) {
  return (
    <section className="mb-4 mt-[26px]">
      <h1 className="mb-2 font-display text-[clamp(28px,5vw,44px)] font-medium leading-[1.08] tracking-[-.025em]">
        {title}
      </h1>
      <p className="max-w-[60ch] text-mute">{intro}</p>
      <div className="mt-6 max-w-[60ch] rounded-[4px] border border-line bg-card p-4">
        <p>This screen is coming in {when}.</p>
        <Link href="/" className="mt-3 inline-block text-acc underline">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
