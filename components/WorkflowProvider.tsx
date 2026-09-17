"use client";

import { STEP_CATALOG } from "@/lib/steps";
import { StepType, TicketResult, Workflow, WorkflowStep } from "@/lib/types";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * App-wide state: the workflow being built + results of the last run.
 * Plain React context with useState - no Redux/Zustand needed at this size.
 * Persisted to localStorage so a page refresh mid-demo loses nothing.
 */

interface WorkflowContextValue {
  workflow: Workflow;
  addStep: (type: StepType) => void;
  removeStep: (id: string) => void;
  moveStep: (id: string, dir: -1 | 1) => void;
  reorderStep: (from: number, to: number) => void;
  updateConfig: (id: string, key: string, value: string) => void;
  setName: (name: string) => void;
  lastRun: TicketResult[] | null;
  setLastRun: (r: TicketResult[]) => void;
  hydrated: boolean;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

function defaultWorkflow(): Workflow {
  return {
    name: "New ticket triage",
    steps: (["classify", "priority", "draft_reply", "route", "notify"] as StepType[]).map((t) => ({
      id: uid(),
      type: t,
      config: { ...STEP_CATALOG.find((s) => s.type === t)!.defaultConfig },
    })),
  };
}

const LS_WORKFLOW = "flowdesk.workflow.v1";
const LASTRUN_KEY = "flowdesk.lastrun.v1";

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [workflow, setWorkflow] = useState<Workflow>(defaultWorkflow);
  const [lastRun, setLastRunState] = useState<TicketResult[] | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state once on mount (client-only; avoids SSR mismatch).
  useEffect(() => {
    try {
      const w = localStorage.getItem(LS_WORKFLOW);
      if (w) setWorkflow(JSON.parse(w));
      const r = localStorage.getItem(LASTRUN_KEY);
      if (r) setLastRunState(JSON.parse(r));
    } catch {
      // corrupted storage: fall back to defaults
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LS_WORKFLOW, JSON.stringify(workflow));
  }, [workflow, hydrated]);

  const addStep = (type: StepType) =>
    setWorkflow((w) => ({
      ...w,
      steps: [...w.steps, { id: uid(), type, config: { ...STEP_CATALOG.find((s) => s.type === type)!.defaultConfig } }],
    }));

  const removeStep = (id: string) => setWorkflow((w) => ({ ...w, steps: w.steps.filter((s) => s.id !== id) }));

  const moveStep = (id: string, dir: -1 | 1) =>
    setWorkflow((w) => {
      const i = w.steps.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= w.steps.length) return w;
      const steps = [...w.steps];
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...w, steps };
    });

  const reorderStep = (from: number, to: number) =>
    setWorkflow((w) => {
      if (from === to || from < 0 || to < 0 || from >= w.steps.length || to >= w.steps.length) return w;
      const steps = [...w.steps];
      const [moved] = steps.splice(from, 1);
      steps.splice(to, 0, moved);
      return { ...w, steps };
    });

  const updateConfig = (id: string, key: string, value: string) =>
    setWorkflow((w) => ({
      ...w,
      steps: w.steps.map((s) => (s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s)),
    }));

  const setName = (name: string) => setWorkflow((w) => ({ ...w, name }));

  const setLastRun = (r: TicketResult[]) => {
    setLastRunState(r);
    try {
      localStorage.setItem(LASTRUN_KEY, JSON.stringify(r));
    } catch {
      // storage full: non-fatal
    }
  };

  return (
    <WorkflowContext.Provider
      value={{ workflow, addStep, removeStep, moveStep, reorderStep, updateConfig, setName, lastRun, setLastRun, hydrated }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow(): WorkflowContextValue {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used inside WorkflowProvider");
  return ctx;
}
