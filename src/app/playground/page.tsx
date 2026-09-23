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
          Break the policy on purpose
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Same deterministic runtime as the lessons. Strip a required tool, force
          the East conflict, or turn the store on, and read which edge fired. The
          teaching copy lives on the path.
        </p>
      </div>
      <PlaygroundStudio />
    </div>
  );
}
