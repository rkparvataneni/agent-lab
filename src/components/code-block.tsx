import { cn } from "@/lib/utils";

export function CodeBlock({
  title,
  source,
  className,
}: {
  title?: string;
  source: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl bg-[#14110d] ring-1 ring-white/10",
        className,
      )}
    >
      {title ? (
        <figcaption className="border-b border-white/10 px-4 py-2 font-mono text-[11px] tracking-wide text-amber-100/60 uppercase">
          {title}
        </figcaption>
      ) : null}
      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-amber-50/90">
        <code>{source}</code>
      </pre>
    </figure>
  );
}
