"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { LinkButton } from "@/components/link-button";
import { Studio } from "@/components/studio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adjacentLessons, type Lesson } from "@/lib/lessons";
import { useProgress } from "@/hooks/use-progress";

export function LessonView({ lesson }: { lesson: Lesson }) {
  const { completed, complete } = useProgress();
  const { prev, next } = adjacentLessons(lesson.slug);
  const done = completed.includes(lesson.slug);

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Path
          </Link>
          <span>/</span>
          <span>Lesson {lesson.number}</span>
          {done ? (
            <Badge className="ml-1">
              <Check data-icon="inline-start" />
              Done
            </Badge>
          ) : (
            <Badge variant="secondary">{lesson.duration}</Badge>
          )}
        </div>
        <h1 className="font-heading max-w-3xl text-4xl leading-[1.1] tracking-tight sm:text-5xl">
          {lesson.title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {lesson.summary}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="flex flex-col gap-6">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
              Design
            </p>
            <h2 className="font-heading mt-2 text-3xl leading-tight">
              {lesson.concept.heading}
            </h2>
          </div>
          {lesson.concept.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
          <ul className="grid gap-2">
            {lesson.concept.takeaways.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-border bg-card/60 px-3 py-2 text-sm leading-6"
              >
                {item}
              </li>
            ))}
          </ul>
          <CodeBlock title={lesson.code.title} source={lesson.code.source} />
        </section>

        <section className="lg:sticky lg:top-20 lg:self-start">
          <Studio
            demo={lesson.demo}
            hint={lesson.studioHint}
            onFirstAnswer={() => complete(lesson.slug)}
          />
        </section>
      </div>

      <footer className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        {prev ? (
          <LinkButton href={`/lesson/${prev.slug}`} variant="ghost">
            <ArrowLeft data-icon="inline-start" />
            {prev.number} {prev.title}
          </LinkButton>
        ) : (
          <LinkButton href="/" variant="ghost">
            <ArrowLeft data-icon="inline-start" />
            Back to the path
          </LinkButton>
        )}
        <div className="flex flex-wrap gap-2">
          {!done ? (
            <Button variant="outline" size="lg" onClick={() => complete(lesson.slug)}>
              Mark as read
            </Button>
          ) : null}
          {next ? (
            <LinkButton href={`/lesson/${next.slug}`}>
              Next · {next.title}
              <ArrowRight data-icon="inline-end" />
            </LinkButton>
          ) : (
            <LinkButton href="/playground">
              Open the playground
              <ArrowRight data-icon="inline-end" />
            </LinkButton>
          )}
        </div>
      </footer>
    </article>
  );
}
