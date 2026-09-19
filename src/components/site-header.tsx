"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { LESSONS } from "@/lib/lessons";
import { useProgress } from "@/hooks/use-progress";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { completed, ready } = useProgress();
  const done = ready ? completed.length : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FlaskConical className="size-4" />
          </span>
          <span className="font-heading text-lg tracking-tight">Agentic Lab</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <Link
            href="/"
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground",
              pathname === "/" && "text-foreground",
            )}
          >
            Path
          </Link>
          <Link
            href="/playground"
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground",
              pathname.startsWith("/playground") && "text-foreground",
            )}
          >
            Playground
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {done}/{LESSONS.length} lessons
          </span>
        </nav>
      </div>
    </header>
  );
}
