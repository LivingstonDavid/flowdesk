import { getAIProvider } from "@/lib/ai/provider";
import { STEP_META } from "@/lib/steps";
import { Classification, StepResult, Ticket, TicketResult, Workflow, WorkflowStep } from "@/lib/types";

/**
 * The workflow engine. Pure TypeScript, no framework: it walks each ticket
 * through the configured steps in order and reports progress via callbacks
 * so the UI can animate. All "AI" work is delegated to the AIProvider seam
 * (see lib/ai/provider.ts) - the engine never talks to a model directly.
 */

export interface EngineCallbacks {
  onTicketStart?(ticket: Ticket): void;
  onStepDone?(ticket: Ticket, result: StepResult): void;
  onTicketDone?(result: TicketResult): void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Deterministic routing table: category -> owning team.
const TEAM_BY_CATEGORY: Record<string, string> = {
  Billing: "Billing Ops",
  Bug: "Engineering",
  "Feature Request": "Product",
  "Account Access": "Support Tier 1",
  Performance: "Site Reliability",
  "How-To": "Support Tier 1",
  Integration: "Solutions Engineering",
  Cancellation: "Retention",
};

function computePriority(ticket: Ticket, confidence: number, vipBoost: boolean) {
  let score = 0;
  if (ticket.sentiment === "angry") score += 2;
  else if (ticket.sentiment === "frustrated") score += 1;
  if (ticket.vip && vipBoost) score += 2;
  if (confidence < 0.78) score += 1; // low-confidence tickets deserve faster human eyes
  const level = score >= 4 ? "P1" : score >= 2 ? "P2" : score >= 1 ? "P3" : "P4";
  const why: string[] = [];
  if (ticket.sentiment !== "calm") why.push(`${ticket.sentiment} sentiment`);
  if (ticket.vip && vipBoost) why.push("VIP account");
  if (confidence < 0.78) why.push("low classification confidence");
  return { level, why: why.length ? why.join(", ") : "no urgency signals" };
}

async function executeStep(
  ticket: Ticket,
  step: WorkflowStep,
  classification: Classification | null,
  reply: string | null
): Promise<{ result: StepResult; classification: Classification | null; reply: string | null }> {
  const provider = getAIProvider();
  const meta = STEP_META[step.type];
  const t0 = Date.now();

  switch (step.type) {
    case "classify": {
      const c = await provider.classify(ticket);
      return {
        classification: c,
        reply,
        result: {
          stepId: step.id,
          stepType: step.type,
          title: `Classified: ${c.category}`,
          detail: `${c.reasoning} Confidence ${(c.confidence * 100).toFixed(0)}%. Taxonomy: ${step.config.taxonomy === "itil-lite" ? "ITIL-lite" : "standard 8 categories"}.`,
          confidence: c.confidence,
          durationMs: Date.now() - t0,
        },
      };
    }
    case "priority": {
      await sleep(140); // local scoring, no model call
      const conf = classification?.confidence ?? 0.8;
      const p = computePriority(ticket, conf, step.config.vipBoost !== "ignore");
      return {
        classification,
        reply,
        result: {
          stepId: step.id,
          stepType: step.type,
          title: `Priority: ${p.level}`,
          detail: `Scored ${p.level} based on ${p.why}.`,
          durationMs: Date.now() - t0,
        },
      };
    }
    case "draft_reply": {
      const c = classification ?? (await provider.classify(ticket));
      const text = await provider.draftReply(ticket, c, step.config.tone ?? "professional");
      return {
        classification: c,
        reply: text,
        result: {
          stepId: step.id,
          stepType: step.type,
          title: `Draft ready (${step.config.tone ?? "professional"} tone)`,
          detail: text,
          durationMs: Date.now() - t0,
        },
      };
    }
    case "route": {
      await sleep(160);
      const c = classification ?? (await provider.classify(ticket));
      const mode = step.config.escalation ?? "angry-or-vip";
      const escalate =
        mode === "angry-or-vip"
          ? ticket.sentiment === "angry" || ticket.vip
          : mode === "angry-only"
            ? ticket.sentiment === "angry"
            : false;
      const team = TEAM_BY_CATEGORY[c.category] ?? "Support Tier 1";
      return {
        classification: c,
        reply,
        result: {
          stepId: step.id,
          stepType: step.type,
          title: escalate ? `Escalated → Tier 2 (+${team})` : `Routed → ${team}`,
          detail: escalate
            ? `Escalated to Tier 2 because of ${ticket.sentiment === "angry" ? "angry sentiment" : "VIP account"}; owning team: ${team}.`
            : `Assigned to ${team} based on category "${c.category}".`,
          durationMs: Date.now() - t0,
        },
      };
    }
    case "notify": {
      await sleep(120);
      const c = classification ?? (await provider.classify(ticket));
      const dest =
        step.config.channel === "email"
          ? "email digest to the support lead"
          : step.config.channel === "slack-escalations"
            ? "Slack #escalations"
            : "Slack #support-triage";
      return {
        classification: c,
        reply,
        result: {
          stepId: step.id,
          stepType: step.type,
          title: `Notified: ${dest}`,
          detail: `Posted summary to ${dest}: "${ticket.id} - ${ticket.subject}" [${c.category}${reply ? ", reply drafted" : ""}].`,
          durationMs: Date.now() - t0,
        },
      };
    }
  }
}

export async function runWorkflow(
  tickets: Ticket[],
  workflow: Workflow,
  cb: EngineCallbacks = {}
): Promise<TicketResult[]> {
  const results: TicketResult[] = [];
  for (const ticket of tickets) {
    cb.onTicketStart?.(ticket);
    let classification: Classification | null = null;
    let reply: string | null = null;
    const stepResults: StepResult[] = [];
    for (const step of workflow.steps) {
      const out = await executeStep(ticket, step, classification, reply);
      classification = out.classification;
      reply = out.reply;
      stepResults.push(out.result);
      cb.onStepDone?.(ticket, out.result);
      await sleep(90); // small beat so the UI animation is readable
    }
    const done: TicketResult = { ticket, status: "done", steps: stepResults };
    results.push(done);
    cb.onTicketDone?.(done);
  }
  return results;
}
