import type { Metadata } from "next";
import { PlaygroundStudio } from "@/components/studio";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Run the simulated agent with every tool, memory, planning, and failure switch exposed.",
};

export default function PlaygroundPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
          Sandbox
        </p>
        <h1 className="font-heading mt-2 text-4xl leading-tight tracking-tight sm:text-5xl">
          Run the loop yourself
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          This is the same deterministic runtime as the lessons. Pick a mission,
          attach or strip tools, and read the trace like a debugger. If you want
          the teaching copy, go back to the path.
        </p>
      </div>
      <PlaygroundStudio />
    </div>
  );
}
