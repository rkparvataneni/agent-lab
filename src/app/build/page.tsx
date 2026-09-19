"use client";

import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUILD_LESSONS } from "@/lib/build-lessons";

export default function BuildIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
          Developer track
        </p>
        <h1 className="font-heading mt-3 text-4xl leading-tight tracking-tight sm:text-5xl">
          LangChain and LangGraph, as you would ship them.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Ten Python lessons. Real <code className="font-mono text-foreground">StateGraph</code>,
          tools, <code className="font-mono text-foreground">create_agent</code>, checkpoints,
          interrupts, a supervisor, and a CI eval suite. The model is scripted so you can study
          the graph without an API key. Swap in ChatOpenAI later — the graph does not change.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href={`/build/${BUILD_LESSONS[0].slug}`}>
            Start 01 · Chain vs graph
            <ArrowRight data-icon="inline-end" />
          </LinkButton>
          <LinkButton href="/lesson/loop" variant="outline">
            Concept studio
          </LinkButton>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="size-4" />
            Run on your machine
          </CardTitle>
          <CardDescription>
            From the repo root. Python 3.10+. No key required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-[#14110d] p-4 font-mono text-[13px] leading-6 text-amber-50/90">
            {`cd python
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
PYTHONPATH=. python -m agentic_lab list
PYTHONPATH=. python -m agentic_lab 04
PYTHONPATH=. python -m pytest`}
          </pre>
        </CardContent>
      </Card>

      <ol className="grid gap-3">
        {BUILD_LESSONS.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              href={`/build/${lesson.slug}`}
              className="block rounded-2xl border border-border bg-card/60 p-4 transition-colors hover:bg-card sm:p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="font-heading text-3xl text-primary/80">{lesson.number}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-medium">{lesson.title}</h2>
                      <Badge variant="outline">{lesson.file}</Badge>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {lesson.summary}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{lesson.command}</span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
