"use client";

import { MANUAL_MINUTES_PER_TICKET } from "@/lib/data/tickets";
import { TicketResult } from "@/lib/types";
import { useWorkflow } from "@/components/WorkflowProvider";
import Icon from "@/components/Icon";
import Link from "next/link";

// Pull a readable outcome out of a ticket's step results.
function outcomeOf(r: TicketResult) {
  const classify = r.steps.find((s) => s.stepType === "classify");
  const priority = r.steps.find((s) => s.stepType === "priority");
  const route = r.steps.find((s) => s.stepType === "route");
  return {
    category: classify?.title.replace("Classified: ", "") ?? "Unclassified",
    confidence: classify?.confidence,
    priority: priority?.title.replace("Priority: ", "") ?? null,
    route: route?.title.replace(/^(Routed|Escalated) → /, "") ?? "Unrouted",
    escalated: route?.title.startsWith("Escalated") ?? false,
    drafted: r.steps.some((s) => s.stepType === "draft_reply"),
    totalMs: r.steps.reduce((a, s) => a + s.durationMs, 0),
  };
}

export default function DashboardPage() {
  const { lastRun, workflow, hydrated } = useWorkflow();

  if (!hydrated) return <main className="page" />;
  if (!lastRun || lastRun.length === 0) {
    return (
      <main className="page">
        <div className="empty-state">
          <div className="big"><Icon name="chart" size={42} /></div>
          <h2>No run data yet</h2>
          <p>Run the workflow over the ticket queue and this dashboard will fill itself in.</p>
          <p><Link href="/run" className="btn">Go to a live run →</Link></p>
        </div>
      </main>
    );
  }

  const outcomes = lastRun.map(outcomeOf);
  const processed = lastRun.length;
  const drafted = outcomes.filter((o) => o.drafted).length;
  const escalated = outcomes.filter((o) => o.escalated).length;
  const confs = outcomes.map((o) => o.confidence).filter((c): c is number => c !== undefined);
  const avgConf = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;
  const minutesSaved = processed * MANUAL_MINUTES_PER_TICKET;
  const hoursSaved = minutesSaved / 60;
  const totalRunMs = outcomes.reduce((a, o) => a + o.totalMs, 0);

  const countBy = (key: (o: ReturnType<typeof outcomeOf>) => string) => {
    const m = new Map<string, number>();
    outcomes.forEach((o) => m.set(key(o), (m.get(key(o)) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  };
  const categories = countBy((o) => o.category);
  const teams = countBy((o) => o.route);

  return (
    <main className="page">
      <div className="page-head">
        <h1 className="page-title">Impact dashboard</h1>
        <p className="page-sub">
          Last run of <strong>{workflow.name}</strong> - {processed} tickets through {workflow.steps.length} steps in {(totalRunMs / 1000).toFixed(1)}s of machine time.
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Tickets processed</div>
          <div className="stat-value">{processed}</div>
          <div className="stat-sub">{(totalRunMs / 1000 / processed).toFixed(2)}s avg per ticket</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Manual time saved</div>
          <div className="stat-value">{hoursSaved.toFixed(1)} <span className="unit">hrs</span></div>
          <div className="stat-sub">vs ~{MANUAL_MINUTES_PER_TICKET} min manual triage + reply each</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Replies auto-drafted</div>
          <div className="stat-value">{drafted}</div>
          <div className="stat-sub">ready for one-click agent review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Escalated to Tier 2</div>
          <div className="stat-value">{escalated}</div>
          <div className="stat-sub">avg classification confidence {(avgConf * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-panel">
          <h3>Tickets by category</h3>
          {categories.map(([cat, n]) => (
            <div className="bar-row" key={cat}>
              <span className="bar-label">{cat}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / processed) * 100}%` }} /></div>
              <span className="bar-count">{n}</span>
            </div>
          ))}
        </div>
        <div className="dash-panel">
          <h3>Routing by team</h3>
          {teams.map(([team, n]) => (
            <div className="bar-row" key={team}>
              <span className="bar-label">{team}</span>
              <div className="bar-track"><div className="bar-fill alt" style={{ width: `${(n / processed) * 100}%` }} /></div>
              <span className="bar-count">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-panel">
        <h3>Processed tickets</h3>
        <table className="dash-table">
          <thead>
            <tr><th>Ticket</th><th>Subject</th><th>Category</th><th>Priority</th><th>Route</th><th>Conf.</th><th>Draft</th></tr>
          </thead>
          <tbody>
            {lastRun.map((r) => {
              const o = outcomeOf(r);
              return (
                <tr key={r.ticket.id}>
                  <td className="mono">{r.ticket.id}</td>
                  <td>{r.ticket.subject}</td>
                  <td><span className="chip cat">{o.category}</span></td>
                  <td>{o.priority ? <span className={`chip ${o.priority === "P1" ? "p1" : o.priority === "P2" ? "p2" : ""}`}>{o.priority}</span> : "-"}</td>
                  <td>{o.escalated ? <span className="chip esc">{o.route}</span> : o.route}</td>
                  <td className="mono">{o.confidence ? `${(o.confidence * 100).toFixed(0)}%` : "-"}</td>
                  <td>{o.drafted ? "✓" : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
