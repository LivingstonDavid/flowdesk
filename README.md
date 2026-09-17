# Flowdesk - Agentic ITSM Workflow Builder

A visual workflow builder for support automation. Compose triage, priority-scoring,
reply-drafting, routing and notification steps on a canvas, then run the workflow
live over a queue of support tickets and watch it classify, draft, route and
escalate - with a dashboard that turns the run into impact numbers.

**Portfolio demo. 100% synthetic data, zero external API calls, zero cost.**

## Run it

```bash
npm install
npm run dev        # development - http://localhost:3000
```

```bash
npm run build      # production build
npm start          # serve the production build - http://localhost:3000
```

Deploys cleanly to Vercel: import the repo, framework preset Next.js, no env
vars needed.

## What's inside

- **Builder** (`/builder`) - drag steps from the palette onto the canvas (or click +),
  reorder, configure, delete. The workflow autosaves to localStorage.
- **Run** (`/run`) - executes the workflow over 21 fictional support tickets from a
  fictional SaaS product ("Nimbus CRM"), step by step, with live progress,
  per-ticket classifications + confidence, drafted replies, routing and escalation.
- **Dashboard** (`/dashboard`) - tickets processed, estimated manual time saved,
  category and routing breakdowns, and a full results table.

## Architecture in one paragraph

Next.js (App Router) + TypeScript, all client-rendered, no database. The workflow
is plain data (JSON), held in a React context and persisted to localStorage. A
framework-free engine (`lib/engine.ts`) walks each ticket through the steps and
reports progress via callbacks. All "AI" work goes through a single interface
(`lib/ai/provider.ts`) - today it's a mock provider with canned, keyword-matched
outputs and simulated latency; swapping in a real LLM means implementing that one
interface and changing one line. See **WALKTHROUGH.md** for the full tour.

## Data

Every ticket, customer, company, reply and metric is fictional and generated
locally in the browser. No real customer data, no external calls.
