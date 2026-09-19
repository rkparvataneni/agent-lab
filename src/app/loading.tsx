export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-16 sm:px-6">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-16 w-full max-w-xl animate-pulse rounded bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-xl bg-muted/70" />
    </div>
  );
}
