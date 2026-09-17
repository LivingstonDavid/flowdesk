// Core domain types for the workflow builder demo.

export type StepType = "classify" | "priority" | "draft_reply" | "route" | "notify";

export interface WorkflowStep {
  id: string;
  type: StepType;
  config: Record<string, string>;
}

export interface Workflow {
  name: string;
  steps: WorkflowStep[];
}

export type Channel = "email" | "chat" | "portal" | "api";

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  customer: string;
  company: string;
  channel: Channel;
  receivedAt: string; // ISO timestamp
  sentiment: "calm" | "frustrated" | "angry";
  vip: boolean;
}

export interface Classification {
  category: string;
  confidence: number; // 0..1
  reasoning: string;
}

export interface StepResult {
  stepId: string;
  stepType: StepType;
  title: string; // short outcome label, e.g. "Classified: Billing"
  detail: string; // longer output, e.g. the drafted reply text
  confidence?: number;
  durationMs: number;
}

export type TicketRunStatus = "pending" | "running" | "done";

export interface TicketResult {
  ticket: Ticket;
  status: TicketRunStatus;
  steps: StepResult[];
}
