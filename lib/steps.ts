import { StepType } from "@/lib/types";

// The palette of building blocks shown in the builder. Each entry defines
// how the step looks and which config knobs it exposes.
export interface ConfigField {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface StepMeta {
  type: StepType;
  name: string;
  icon: string;
  blurb: string;
  fields: ConfigField[];
  defaultConfig: Record<string, string>;
}

export const STEP_CATALOG: StepMeta[] = [
  {
    type: "classify",
    name: "Classify ticket",
    icon: "tag",
    blurb: "AI labels the ticket: Billing, Bug, How-To, ...",
    fields: [
      {
        key: "taxonomy",
        label: "Taxonomy",
        options: [
          { value: "standard-8", label: "Standard 8 categories" },
          { value: "itil-lite", label: "ITIL-lite (Incident/Request/Change)" },
        ],
      },
    ],
    defaultConfig: { taxonomy: "standard-8" },
  },
  {
    type: "priority",
    name: "Score priority",
    icon: "flag",
    blurb: "P1-P4 from sentiment, VIP status and confidence",
    fields: [
      {
        key: "vipBoost",
        label: "VIP customers",
        options: [
          { value: "boost", label: "Boost priority" },
          { value: "ignore", label: "Treat like everyone" },
        ],
      },
    ],
    defaultConfig: { vipBoost: "boost" },
  },
  {
    type: "draft_reply",
    name: "Draft reply",
    icon: "pen",
    blurb: "AI writes a first response for agent review",
    fields: [
      {
        key: "tone",
        label: "Tone",
        options: [
          { value: "professional", label: "Professional" },
          { value: "friendly", label: "Friendly" },
          { value: "concise", label: "Concise" },
        ],
      },
    ],
    defaultConfig: { tone: "professional" },
  },
  {
    type: "route",
    name: "Route & escalate",
    icon: "branch",
    blurb: "Send to the right team; escalate angry/VIP",
    fields: [
      {
        key: "escalation",
        label: "Escalate when",
        options: [
          { value: "angry-or-vip", label: "Angry sentiment or VIP" },
          { value: "angry-only", label: "Angry sentiment only" },
          { value: "never", label: "Never auto-escalate" },
        ],
      },
    ],
    defaultConfig: { escalation: "angry-or-vip" },
  },
  {
    type: "notify",
    name: "Notify channel",
    icon: "megaphone",
    blurb: "Post a summary where the team works",
    fields: [
      {
        key: "channel",
        label: "Destination",
        options: [
          { value: "slack-triage", label: "Slack #support-triage" },
          { value: "slack-escalations", label: "Slack #escalations" },
          { value: "email", label: "Email digest" },
        ],
      },
    ],
    defaultConfig: { channel: "slack-triage" },
  },
];

export const STEP_META: Record<StepType, StepMeta> = Object.fromEntries(
  STEP_CATALOG.map((s) => [s.type, s])
) as Record<StepType, StepMeta>;
