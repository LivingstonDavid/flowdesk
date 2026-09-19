# Flowdesk - how it works, in plain terms

Read this once and you can defend every piece of the demo on a client call.
It's written to answer the questions a technical buyer actually asks.

## The 30-second pitch

"This is a visual builder for support-automation workflows. You compose steps -
classify, score priority, draft a reply, route, notify - on a canvas. Then you run
the workflow over a real-looking ticket queue and watch it process each ticket live,
and the dashboard shows you the hours it saves. The AI runs canned right now so the
demo works offline with zero API cost, but it's wired behind one interface, so
plugging in a real model is a one-line change."

## File map

```
app/                      Next.js App Router pages (all client components)
  page.tsx                Landing page
  builder/page.tsx        The visual workflow builder
  run/page.tsx            Live execution view
  dashboard/page.tsx      Impact dashboard
  globals.css             Hand-rolled dark theme, no UI library
components/
  WorkflowProvider.tsx    App state: React context + localStorage
  Icon.tsx                Inline SVG icons (no emoji-font dependency)
  Shell.tsx                App shell: sidebar for app pages, top nav on landing
lib/
  types.ts                Domain types: Workflow, Ticket, StepResult, ...
  steps.ts                The step palette: metadata + config fields per step type
  engine.ts               The workflow engine (framework-free)
  ai/provider.ts          THE SEAM: AIProvider interface + mock implementation
  data/tickets.ts         21 synthetic tickets + demo constants
```

## The questions you'll get

### "How does the triage/classification step work?"

Every step the workflow runs goes through `executeStep()` in `lib/engine.ts`. For
classification, the engine calls `provider.classify(ticket)`. Today the provider is
`MockAIProvider` in `lib/ai/provider.ts`: it keyword-matches the ticket text against
an ordered list of category rules (Billing, Bug, Account Access, ...) and returns a
category, a confidence score and a one-line reasoning string. Confidence is a stable
pseudo-random value derived from a hash of the ticket ID, so the demo is deterministic
across runs.

The point to make on a call: the engine doesn't know or care whether the answer came
from keyword rules or GPT. It asked the provider for a `Classification` and got one.

### "Where would a real LLM plug in?"

`lib/ai/provider.ts`. There is exactly one interface:

```ts
interface AIProvider {
  classify(ticket: Ticket): Promise<Classification>;
  draftReply(ticket: Ticket, classification: Classification, tone: string): Promise<string>;
}
```

To go live: write `OpenAIProvider implements AIProvider` (its `classify` sends the
ticket to the model with a structured-output prompt, its `draftReply` sends ticket +
category + tone), move it behind a Next.js Route Handler so the API key stays
server-side, and change one line in `getAIProvider()`. That migration path is written
as a TODO comment at the top of the file. Nothing else in the codebase changes -
that's the whole reason the interface exists.

### "How does the reply drafting work?"

Same seam, `provider.draftReply()`. The mock picks a per-category reply template,
fills in the customer's first name, and wraps it with an opener/closer that matches
the tone configured on the step (professional / friendly / concise). The tone is a
step config field, which demonstrates that steps are configurable data, not
hard-coded behavior.

### "How does routing and escalation work?"

Deterministic rules in `lib/engine.ts`: a category-to-team lookup table
(Billing -> Billing Ops, Bug -> Engineering, ...) plus an escalation rule the user
configures on the step - by default "angry sentiment or VIP" escalates to Tier 2.
The priority step is similar: a transparent scoring function over sentiment, VIP
status and classification confidence that produces P1-P4 with a human-readable
"why" string. In production these tables would be per-customer configuration; the
demo keeps them as constants so they're easy to read.

### "How is state managed?"

Plain React context (`components/WorkflowProvider.tsx`) holding two things: the
workflow being built, and the results of the last run. Both persist to localStorage,
so a page refresh mid-demo loses nothing. No Redux, no Zustand - at this size a
context with `useState` is the right tool, and saying so shows judgment.

The workflow itself is just JSON: `{ name, steps: [{ id, type, config }] }`. That's
a deliberate design point - because a workflow is data, it can be saved to a DB,
versioned, shared between users, or edited by non-developers in v2.

### "How does the run view animate?"

The engine is `async` and emits callbacks: `onTicketStart`, `onStepDone`,
`onTicketDone`. The run page passes callbacks that update React state, so the UI
re-renders as each step completes. The mock provider sleeps 120-720ms per call to
simulate model latency, which is what makes the progress feel alive instead of
instant. The engine is sequential on purpose - one ticket at a time, one step at a
time - because that's what reads well live; parallelizing it is a config change, not
a rewrite.

### "Where does the data come from?"

`lib/data/tickets.ts`: 21 hand-written fictional tickets for a fictional SaaS
product, Nimbus CRM. Varied on purpose - billing, bugs, how-tos, integrations,
cancellations, a couple of angry VIPs - so every step type has something to chew on.
The "manual time saved" number on the dashboard assumes 11 minutes of manual
triage + first reply per ticket (a conservative, defensible industry figure) and
multiplies by tickets processed.

### "Is this production-ready?"

Honest answer: it's a v1 demo of the concept and the UX, built to production code
standards. What's mocked: the AI (canned outputs, simulated latency), persistence
(localStorage, single user), and the notify step (it renders what it *would* post
to Slack instead of posting). What's real: the entire workflow model, the engine,
the step-config system, the run pipeline, the analytics computation, and the UI.
A v2 would add: a real LLM behind the provider interface, server-side persistence
with saved workflows, branching/conditional steps, a real drag-and-drop grid canvas,
webhook delivery for the notify step, and streaming token-by-token reply drafting.

### "Why Next.js?"

It's the stack I ship daily. App Router gives clean route structure, everything
deploys free on Vercel with zero config, and when the mock provider becomes a real
LLM call, Route Handlers give me a server-side home for the API key without
standing up a separate service.
