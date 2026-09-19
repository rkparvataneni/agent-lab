"use client";

import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Eye,
  NotebookPen,
  Route,
  Wrench,
} from "lucide-react";
import type { AgentStep, StepKind } from "@/lib/agent/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const KIND_STYLE: Record<
  StepKind,
  { label: string; className: string; icon: typeof Brain }
> = {
  thought: {
    label: "Thought",
    className: "border-amber-500/30 bg-amber-500/8 text-amber-100",
    icon: Brain,
  },
  action: {
    label: "Action",
    className: "border-sky-500/30 bg-sky-500/8 text-sky-100",
    icon: Wrench,
  },
  observation: {
    label: "Observation",
    className: "border-violet-500/30 bg-violet-500/8 text-violet-100",
    icon: Eye,
  },
  plan: {
    label: "Plan",
    className: "border-orange-400/30 bg-orange-400/8 text-orange-100",
    icon: Route,
  },
  replan: {
    label: "Replan",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-100",
    icon: Route,
  },
  memory: {
    label: "Memory",
    className: "border-emerald-500/30 bg-emerald-500/8 text-emerald-100",
    icon: NotebookPen,
  },
  answer: {
    label: "Answer",
    className: "border-lime-400/35 bg-lime-400/10 text-lime-100",
    icon: CheckCircle2,
  },
  error: {
    label: "Blocked",
    className: "border-destructive/40 bg-destructive/10 text-red-100",
    icon: AlertTriangle,
  },
};

export function AgentTrace({
  steps,
  visibleCount,
  emptyLabel,
}: {
  steps: AgentStep[];
  visibleCount: number;
  emptyLabel: string;
}) {
  const visible = steps.slice(0, visibleCount);

  if (visible.length === 0) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {visible.map((step, index) => {
        const meta = KIND_STYLE[step.kind];
        const Icon = meta.icon;
        return (
          <li
            key={step.id}
            className={cn(
              "rounded-xl border px-4 py-3 shadow-sm",
              meta.className,
              index === visible.length - 1 && "ring-1 ring-white/10",
            )}
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Icon className="size-3.5 opacity-80" />
              <span className="font-mono text-[11px] tracking-wider uppercase opacity-80">
                {String(index + 1).padStart(2, "0")} · {meta.label}
              </span>
              {step.tool ? (
                <Badge variant="outline" className="border-white/20 text-[10px] text-inherit">
                  {step.tool}
                </Badge>
              ) : null}
            </div>
            <p className="font-medium">{step.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 opacity-90">
              {step.body}
            </p>
            {step.args ? (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-black/25 px-3 py-2 font-mono text-[11px] leading-5 opacity-80">
                {JSON.stringify(step.args, null, 2)}
              </pre>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
