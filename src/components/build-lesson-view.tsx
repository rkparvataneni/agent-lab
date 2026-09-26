import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { LinkButton } from "@/components/link-button";
import { Badge } from "@/components/ui/badge";
import { adjacentBuild, STUDIO_FOR_BUILD, type BuildLesson } from "@/lib/build-lessons";

export function BuildLessonView({
  lesson,
  source,
}: {
  lesson: BuildLesson;
  source: string;
}) {
  const { prev, next } = adjacentBuild(lesson.slug);

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href="/build" className="hover:text-foreground">
            Build
          </Link>
          <span>/</span>
          <span>Lesson {lesson.number}</span>
          <Badge variant="outline">{lesson.file}</Badge>
        </div>
        <h1 className="font-heading mt-3 max-w-3xl text-4xl leading-[1.1] tracking-tight sm:text-5xl">
          {lesson.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{lesson.summary}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <section className="flex flex-col gap-5">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
              Why this exists
            </p>
            <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{lesson.why}</p>
          </div>
          <ul className="grid gap-2">
            {lesson.youWill.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-border bg-card/60 px-3 py-2 text-sm leading-6"
              >
                {item}
              </li>
            ))}
          </ul>
          <LinkButton href={`/lesson/${STUDIO_FOR_BUILD[lesson.slug]}`} variant="outline">
            Open the design studio
            <ArrowRight data-icon="inline-end" />
          </LinkButton>
          <div className="rounded-xl border border-border bg-card/70 px-4 py-3">
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              Run this file
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-[13px] text-foreground">
              cd python && PYTHONPATH=. python -m agentic_lab {lesson.number}
            </pre>
          </div>
        </section>

        <CodeBlock title={`python/agentic_lab/lessons/${lesson.file}`} source={source} />
      </div>

      <footer className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {prev ? (
          <LinkButton href={`/build/${prev.slug}`} variant="ghost">
            <ArrowLeft data-icon="inline-start" />
            {prev.number} {prev.title}
          </LinkButton>
        ) : (
          <LinkButton href="/build" variant="ghost">
            <ArrowLeft data-icon="inline-start" />
            All build lessons
          </LinkButton>
        )}
        {next ? (
          <LinkButton href={`/build/${next.slug}`}>
            Next · {next.title}
            <ArrowRight data-icon="inline-end" />
          </LinkButton>
        ) : (
          <LinkButton href="/playground">Back to the studio playground</LinkButton>
        )}
      </footer>
    </article>
  );
}
