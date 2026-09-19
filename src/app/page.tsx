"use client";

import Link from "next/link";
import { ArrowRight, Check, FlaskConical, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProgress } from "@/hooks/use-progress";
import { LESSONS } from "@/lib/lessons";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { completed, ready, reset } = useProgress();
  const nextLesson =
    LESSONS.find((lesson) => !completed.includes(lesson.slug)) ?? LESSONS[0];
  const allDone = ready && completed.length === LESSONS.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase">
            A workshop, not a chat demo
          </p>
          <h1 className="font-heading mt-4 max-w-3xl text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            Learn agentic AI by watching the loop work.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Five short lessons, then a playground. You will see a model think, call
            tools, stall when a hand is missing, remember a fact, and recover from a
            failed booking. No API key. The agent is simulated so the traces stay
            readable.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" render={<Link href={`/lesson/${nextLesson.slug}`} />}>
              {completed.length === 0 ? "Start lesson 01" : allDone ? "Replay lesson 01" : `Continue · ${nextLesson.title}`}
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/playground" />}>
              <Play data-icon="inline-start" />
              Skip to playground
            </Button>
          </div>
        </div>

        <Card className="bg-card/70">
          <CardHeader>
            <CardTitle>What you will be able to build</CardTitle>
            <CardDescription>
              After this path you should be able to write the loop yourself, attach
              tools, and debug a trace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm leading-6">
            <p>A chatbot is one completion. An agent is a program around a model.</p>
            <p>Tools are typed functions you execute. The model only proposes calls.</p>
            <p>ReAct, memory, and planning are layers on the same cycle.</p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-3xl">The path</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ready ? `${completed.length} of ${LESSONS.length} complete` : "Loading progress…"}
            </p>
          </div>
          {ready && completed.length > 0 ? (
            <Button variant="ghost" onClick={reset}>
              Reset progress
            </Button>
          ) : null}
        </div>

        <ol className="grid gap-3">
          {LESSONS.map((lesson, index) => {
            const done = completed.includes(lesson.slug);
            const locked =
              ready && index > 0 && !completed.includes(LESSONS[index - 1].slug) && !done;
            return (
              <li key={lesson.slug}>
                <Link
                  href={`/lesson/${lesson.slug}`}
                  className={cn(
                    "block rounded-2xl border border-border bg-card/60 p-4 transition-colors hover:bg-card sm:p-5",
                    done && "border-primary/30",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="font-heading text-3xl text-primary/80">
                        {lesson.number}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-medium">{lesson.title}</h3>
                          {done ? (
                            <Badge>
                              <Check data-icon="inline-start" />
                              Done
                            </Badge>
                          ) : locked ? (
                            <Badge variant="outline">Recommended next: finish {LESSONS[index - 1].number}</Badge>
                          ) : (
                            <Badge variant="secondary">{lesson.duration}</Badge>
                          )}
                        </div>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                          {lesson.summary}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground sm:shrink-0">
                      Open lesson
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-2xl border border-primary/25 bg-primary/8 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <FlaskConical className="size-4" />
            </span>
            <div>
              <h2 className="font-heading text-2xl">Playground</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                Same runtime, every switch exposed. Change the mission, strip a tool,
                turn on memory, force a conflict.
              </p>
            </div>
          </div>
          <Button size="lg" render={<Link href="/playground" />}>
            Open playground
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </section>
    </div>
  );
}
