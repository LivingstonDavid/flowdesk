import { Classification, Ticket } from "@/lib/types";

/**
 * AIProvider is the seam between the workflow engine and "the model".
 *
 * Everything in this demo runs on MockAIProvider: deterministic, canned,
 * keyword-matched outputs with simulated latency. Zero network calls,
 * zero cost, works offline in a client demo.
 *
 * TO PLUG IN A REAL LLM (OpenAI, Anthropic, ...):
 *   1. Create `OpenAIProvider implements AIProvider` next to this file.
 *   2. Implement classify() and draftReply() with real API calls
 *      (move them behind a Next.js Route Handler so the key stays server-side).
 *   3. Change the single line in getAIProvider() below.
 * Nothing else in the app touches a model directly - the engine only
 * ever talks to this interface.
 */
export interface AIProvider {
  readonly name: string;
  classify(ticket: Ticket): Promise<Classification>;
  draftReply(ticket: Ticket, classification: Classification, tone: string): Promise<string>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Small deterministic hash so canned "confidence" values are stable per ticket.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface CategoryRule {
  category: string;
  keywords: string[];
  reasoning: string;
}

// Ordered: first rule with a keyword hit wins. This is deliberately simple -
// it stands in for an LLM classification call, not for real NLP.
const RULES: CategoryRule[] = [
  {
    category: "Account Access",
    keywords: ["locked out", "reset password", "reset email", "log in", "login", "sso", "okta", "password"],
    reasoning: "Authentication and sign-in language detected (login, lockout, reset).",
  },
  {
    category: "Cancellation",
    keywords: ["cancel", "in-house tool", "no further charges"],
    reasoning: "Explicit cancellation intent detected.",
  },
  {
    category: "Billing",
    keywords: ["charged", "invoice", "refund", "billing", "proration", "upgrade", "pricing", "purchase", "plan"],
    reasoning: "Payment, invoice and plan-change terms detected.",
  },
  {
    category: "Performance",
    keywords: ["slow", "loading", "spinner", "15-20 seconds", "degraded", "performance"],
    reasoning: "Latency / degraded-performance language detected.",
  },
  {
    category: "Integration",
    keywords: ["integration", "slack", "zapier", "salesforce", "webhook", "api", "sync", "hmac"],
    reasoning: "References a third-party system or API surface.",
  },
  {
    category: "Feature Request",
    keywords: ["feature request", "would love", "on the roadmap", "enforce 2fa", "when?"],
    reasoning: "Asks for capability that does not exist yet.",
  },
  {
    category: "Bug",
    keywords: ["crash", "crashes", "bug", "wrong", "duplicate", "502", "redirect loop", "not working", "stopped", "never arrives", "splits", "failing"],
    reasoning: "Reports broken behavior in existing functionality.",
  },
  {
    category: "How-To",
    keywords: ["how do i", "how do we", "where did", "not sure which", "setting up", "how to"],
    reasoning: "Question about using an existing feature.",
  },
];

const FALLBACK: CategoryRule = {
  category: "How-To",
  keywords: [],
  reasoning: "No strong signal; defaulted to a general support question.",
};

// Canned first-reply templates per category. {name} = customer first name.
// Tone adjusts opener/closer at draft time.
const REPLY_TEMPLATES: Record<string, string> = {
  "Account Access":
    "Hi {name},\n\nThanks for flagging this - I know how disruptive login trouble is. I've reset the sign-in state on your account and sent a fresh access link to the affected address. If it doesn't arrive within 5 minutes, tell me and I'll provision a temporary login manually.\n\nI'll stay on this until you're back in.",
  Billing:
    "Hi {name},\n\nThanks for the clear details - that made this quick to pin down. I've located the charge on your account and started the correction on our side. You'll see the adjustment confirmed by email within 1-2 business days, and I'll reply here the moment it's done.\n\nSorry for the hassle.",
  Integration:
    "Hi {name},\n\nThanks for the detailed report. I've reproduced the connection behavior on a test workspace and narrowed it to the delivery layer rather than your configuration. I'm attaching a temporary workaround below, and I've linked this ticket to the engineering issue so you'll get notified the moment the fix ships.\n\nAppreciate your patience.",
  Performance:
    "Hi {name},\n\nThanks for reporting this - the specifics you included really help. I've pulled the performance traces for your workspace and can see the slowdown. The team is investigating now; in the meantime I've applied a cache refresh on your account, which should relieve most of it.\n\nI'll update you within 24 hours with a root-cause summary.",
  Cancellation:
    "Hi {name},\n\nOf course - I've scheduled the cancellation for the end of your current billing cycle, and you will not be charged again. Your data export will remain available for 30 days afterwards in case you need anything.\n\nIf there's anything we could have done better, I'd genuinely like to hear it.",
  "Feature Request":
    "Hi {name},\n\nGreat suggestion - I've logged it with the product team and linked it to the existing request, which adds weight to prioritization. I can't promise a date, but I've tagged your account so you'll be notified if it ships.\n\nThanks for taking the time to write it up.",
  Bug:
    "Hi {name},\n\nThanks for the report - I've reproduced the issue and filed it with engineering as a confirmed bug, linked to your account. I'll share the issue ID shortly and keep you posted on the fix. If it's blocking critical work in the meantime, reply here and I'll find you a workaround today.\n\nSorry about the friction.",
  "How-To":
    "Hi {name},\n\nHappy to help. Here's the short version: open Settings, then the relevant section for your question - I've attached a step-by-step guide with screenshots for your exact plan. If anything on that path looks different on your side, send me a screenshot and I'll walk you through it live.\n\nYou're all set.",
};

const TONE_OPENERS: Record<string, string> = {
  friendly: "Thanks so much for reaching out!",
  professional: "Thank you for contacting support.",
  concise: "",
};

const TONE_CLOSERS: Record<string, string> = {
  friendly: "\n\nWarm regards,\nNimbus Support",
  professional: "\n\nBest regards,\nNimbus Support",
  concise: "\n\n- Nimbus Support",
};

export class MockAIProvider implements AIProvider {
  readonly name = "mock-canned-v1";

  async classify(ticket: Ticket): Promise<Classification> {
    await sleep(280 + (hash(ticket.id) % 240)); // simulated model latency
    const text = `${ticket.subject} ${ticket.body}`.toLowerCase();
    const rule =
      RULES.find((r) => r.keywords.some((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text))) ??
      FALLBACK;
    const confidence = 0.72 + (hash(ticket.id + rule.category) % 25) / 100; // 0.72 - 0.96
    return { category: rule.category, confidence, reasoning: rule.reasoning };
  }

  async draftReply(ticket: Ticket, classification: Classification, tone: string): Promise<string> {
    await sleep(420 + (hash(ticket.subject) % 300)); // "generation" takes a bit longer
    const firstName = ticket.customer.split(" ")[0];
    const base = (REPLY_TEMPLATES[classification.category] ?? REPLY_TEMPLATES["How-To"]).replaceAll("{name}", firstName);
    const opener = TONE_OPENERS[tone] ?? "";
    const closer = TONE_CLOSERS[tone] ?? TONE_CLOSERS.professional;
    return (opener ? opener + "\n\n" : "") + base + closer;
  }
}

/** Single switch point for the whole app. */
export function getAIProvider(): AIProvider {
  // TODO: return new OpenAIProvider(process.env.OPENAI_API_KEY) for live runs.
  return new MockAIProvider();
}
