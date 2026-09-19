"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-20">
      <p className="font-mono text-[11px] tracking-[0.18em] text-destructive uppercase">
        Something broke
      </p>
      <h1 className="font-heading text-4xl tracking-tight">The workshop hit an unexpected error.</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        {error.message || "The page failed to render. Try again, or go back to the path."}
      </p>
      <div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
