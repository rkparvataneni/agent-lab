import { LinkButton } from "@/components/link-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-20">
      <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
        404
      </p>
      <h1 className="font-heading text-4xl tracking-tight">That page is not on the path.</h1>
      <p className="text-muted-foreground">
        The lesson slug is missing, or the URL is wrong. Head back to the workshop
        path and pick a numbered lesson.
      </p>
      <div>
        <LinkButton href="/">Back to the path</LinkButton>
      </div>
    </div>
  );
}
