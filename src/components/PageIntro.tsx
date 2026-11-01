type Props = {
  title: string;
  intro?: string;
};

export function PageIntro({ title, intro }: Props) {
  return (
    <div className="mb-6 mt-[26px]">
      <h1 className="mb-2 font-display text-[clamp(28px,5vw,44px)] font-medium leading-[1.08] tracking-[-.025em]">
        {title}
      </h1>
      {intro && <p className="max-w-[60ch] text-mute">{intro}</p>}
    </div>
  );
}
