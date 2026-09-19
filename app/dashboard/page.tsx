"use client";

import { MANUAL_MINUTES_PER_TICKET } from "@/lib/data/tickets";
import { StepType, TicketResult } from "@/lib/types";
import { STEP_META } from "@/lib/steps";
import { useWorkflow } from "@/components/WorkflowProvider";
import Icon from "@/components/Icon";
import Link from "next/link";

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const DONUT_COLORS = ["#818cf8", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171", "#94a3b8", "#4ade80", "#fb923c"];
const PRIO_COLORS: Record<string, string> = { P1: "#f87171", P2: "#fbbf24", P3: "#22d3ee", P4: "#39415a" };

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

function Sparkline({ values, stroke = "#818cf8" }: { values: number[]; stroke?: string }) {
  const w = 96, h = 30;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${((i / Math.max(values.length - 1, 1)) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 5)).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { lastRun, workflow, hydrated } = useWorkflow();

  if (!hydrated) return <main className="page" />;
  if (!lastRun || lastRun.length === 0) {
    return (
      <main className="page">
        <div className="empty-state panel">
          <div className="big"><Icon name="chart" size={40} /></div>
          <h2>No run data yet</h2>
          <p>Run the workflow over the ticket queue and this dashboard fills itself in.</p>
          <p><Link href="/run" className="btn">Go to a live run <Icon name="arrowRight" size={14} /></Link></p>
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
  const prios = countBy((o) => o.priority ?? "P4");
  const prioOrder = ["P1", "P2", "P3", "P4"].map((p) => [p, prios.find(([k]) => k === p)?.[1] ?? 0] as [string, number]);

  // throughput: cumulative tickets processed over machine time
  const cumTimes: number[] = [];
  outcomes.reduce((acc, o) => { const t = acc + o.totalMs; cumTimes.push(t); return t; }, 0);
  const totalT = cumTimes[cumTimes.length - 1] || 1;
  const thruPts = cumTimes.map((t, i) => `${((t / totalT) * 100).toFixed(1)},${(40 - ((i + 1) / processed) * 38).toFixed(1)}`);
  const thruLine = `0,40 ${thruPts.join(" ")}`;
  const thruArea = `M0,40 L${thruPts.join(" L")} L100,40 Z`;

  // per-step-type average latency
  const latencyByType = new Map<StepType, number[]>();
  lastRun.forEach((r) => r.steps.forEach((s) => {
    const arr = latencyByType.get(s.stepType) ?? [];
    arr.push(s.durationMs);
    latencyByType.set(s.stepType, arr);
  }));
  const latencies = Array.from(latencyByType.entries()).map(([type, ds]) => ({
    type,
    avg: ds.reduce((a, b) => a + b, 0) / ds.length,
  })).sort((a, b) => b.avg - a.avg);
  const maxLat = Math.max(...latencies.map((l) => l.avg), 1);

  // donut segments
  let donutOffset = 25;
  const donutSegs = teams.map(([team, n], i) => {
    const pct = (n / processed) * 100;
    const seg = { team, n, pct, color: DONUT_COLORS[i % DONUT_COLORS.length], offset: donutOffset };
    donutOffset -= pct;
    return seg;
  });

  const sparkVals = cumTimes.map((_, i) => i + 1);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Impact dashboard</h1>
          <p className="page-sub">
            Last run of <strong>{workflow.name}</strong> - {processed} tickets through {workflow.steps.length} steps in {(totalRunMs / 1000).toFixed(1)}s of machine time.
          </p>
        </div>
        <Link href="/run" className="btn btn-ghost btn-sm"><Icon name="refresh" size={13} /> New run</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card panel">
          <div className="stat-top"><span className="stat-label">Tickets processed</span><span className="stat-delta info">{(totalRunMs / 1000 / processed).toFixed(2)}s avg</span></div>
          <div className="stat-value">{processed}</div>
          <div className="stat-sub">full queue, zero manual touches</div>
          <Sparkline values={sparkVals} />
        </div>
        <div className="stat-card panel">
          <div className="stat-top"><span className="stat-label">Manual time saved</span><span className="stat-delta up">+{MANUAL_MINUTES_PER_TICKET}m × {processed}</span></div>
          <div className="stat-value">{hoursSaved.toFixed(1)} <span className="unit">hrs</span></div>
          <div className="stat-sub">vs ~{MANUAL_MINUTES_PER_TICKET} min manual triage + reply each</div>
          <Sparkline values={sparkVals.map((v) => v * MANUAL_MINUTES_PER_TICKET)} stroke="#34d399" />
        </div>
        <div className="stat-card panel">
          <div className="stat-top"><span className="stat-label">Replies auto-drafted</span><span className="stat-delta info">{((drafted / processed) * 100).toFixed(0)}% coverage</span></div>
          <div className="stat-value">{drafted}</div>
          <div className="stat-sub">ready for one-click agent review</div>
          <Sparkline values={sparkVals.map((v) => (v * drafted) / processed)} stroke="#22d3ee" />
        </div>
        <div className="stat-card panel">
          <div className="stat-top"><span className="stat-label">Escalated to Tier 2</span><span className="stat-delta up">{(avgConf * 100).toFixed(0)}% avg conf</span></div>
          <div className="stat-value">{escalated}</div>
          <div className="stat-sub">angry sentiment or VIP accounts</div>
          <Sparkline values={outcomes.map((o) => (o.escalated ? 2 : 1))} stroke="#fbbf24" />
        </div>
      </div>

      <div className="dash-grid-3">
        <div className="dash-panel panel">
          <h3>Throughput</h3>
          <p className="dash-panel-sub">cumulative tickets processed over machine time</p>
          <svg width="100%" height="120" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="thru" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6366f1" stopOpacity="0.45" />
                <stop offset="1" stopColor="#6366f1" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={thruArea} fill="url(#thru)" />
            <polyline points={thruLine} fill="none" stroke="#818cf8" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="progress-label" style={{ marginTop: 6 }}>
            <span>0s</span>
            <span>{processed} tickets</span>
            <span>{(totalRunMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div className="dash-panel panel">
          <h3>Routing by team</h3>
          <p className="dash-panel-sub">where tickets landed after the run</p>
          <div className="donut-wrap">
            <svg width="104" height="104" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1a2030" strokeWidth="5" />
              {donutSegs.map((s) => (
                <circle
                  key={s.team}
                  cx="21" cy="21" r="15.915" fill="transparent"
                  stroke={s.color} strokeWidth="5"
                  strokeDasharray={`${s.pct.toFixed(2)} ${(100 - s.pct).toFixed(2)}`}
                  strokeDashoffset={s.offset}
                />
              ))}
              <text x="21" y="20.5" textAnchor="middle" fill="#e9ecf3" fontSize="7.5" fontWeight="700">{teams.length}</text>
              <text x="21" y="26.5" textAnchor="middle" fill="#5c6680" fontSize="3.4">TEAMS</text>
            </svg>
            <div className="donut-legend">
              {donutSegs.slice(0, 5).map((s) => (
                <div className="donut-legend-row" key={s.team}>
                  <span className="donut-swatch" style={{ background: s.color }} />
                  <span className="dl-name">{s.team}</span>
                  <span className="mono">{s.n}</span>
                </div>
              ))}
              {donutSegs.length > 5 && <div className="donut-legend-row" style={{ color: "var(--text-faint)" }}>+{donutSegs.length - 5} more</div>}
            </div>
          </div>
        </div>

        <div className="dash-panel panel">
          <h3>Priority mix</h3>
          <p className="dash-panel-sub">urgency after scoring</p>
          <div className="prio-strip">
            {prioOrder.map(([p, n]) => (
              <span key={p} className="prio-seg" style={{ width: `${(n / processed) * 100}%`, background: PRIO_COLORS[p] }} title={`${p}: ${n}`} />
            ))}
          </div>
          <div className="prio-legend">
            {prioOrder.map(([p, n]) => (
              <span key={p} className="donut-legend-row" style={{ gap: 6 }}>
                <span className="donut-swatch" style={{ background: PRIO_COLORS[p] }} />
                {p} <span className="mono" style={{ marginLeft: 2 }}>{n}</span>
              </span>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border-soft)", marginTop: 16, paddingTop: 14 }}>
            <h3 style={{ marginBottom: 12 }}>Avg step latency</h3>
            {latencies.map((l) => (
              <div className="latency-row" key={l.type}>
                <span className="latency-label">{STEP_META[l.type].name}</span>
                <div className="bar-track" style={{ flex: 1, height: 8 }}>
                  <div className="bar-fill alt" style={{ width: `${(l.avg / maxLat) * 100}%` }} />
                </div>
                <span className="latency-val">{l.avg.toFixed(0)}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-panel panel">
          <h3>Tickets by category</h3>
          <p className="dash-panel-sub">classification across the queue</p>
          {categories.map(([cat, n]) => (
            <div className="bar-row" key={cat}>
              <span className="bar-label">{cat}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / processed) * 100}%` }} /></div>
              <span className="bar-count">{n}</span>
              <span className="bar-pct">{((n / processed) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
        <div className="dash-panel panel">
          <h3>Routing detail</h3>
          <p className="dash-panel-sub">volume per owning team</p>
          {teams.map(([team, n]) => (
            <div className="bar-row" key={team}>
              <span className="bar-label">{team}</span>
              <div className="bar-track"><div className="bar-fill alt" style={{ width: `${(n / processed) * 100}%` }} /></div>
              <span className="bar-count">{n}</span>
              <span className="bar-pct">{((n / processed) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-panel-head" style={{ marginTop: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13.5 }}>Processed tickets</h3>
          <p className="dash-panel-sub" style={{ margin: "3px 0 0" }}>every outcome from the last run</p>
        </div>
        <span className="chip">{processed} rows</span>
      </div>
      <div className="table-scroll">
        <table className="dash-table">
          <thead>
            <tr><th>Ticket</th><th>Subject</th><th>Category</th><th>Priority</th><th>Route</th><th>Conf.</th><th>Draft</th><th>Time</th></tr>
          </thead>
          <tbody>
            {lastRun.map((r) => {
              const o = outcomeOf(r);
              return (
                <tr key={r.ticket.id}>
                  <td className="mono">{r.ticket.id}</td>
                  <td>
                    <div className="td-subject">{r.ticket.subject}</div>
                    <div className="td-customer"><span className="avatar sm" style={{ width: 20, height: 20, fontSize: 9 }}>{initials(r.ticket.customer)}</span>{r.ticket.customer} · {r.ticket.company}</div>
                  </td>
                  <td><span className="chip cat">{o.category}</span></td>
                  <td>{o.priority ? <span className={`chip ${o.priority === "P1" ? "p1" : o.priority === "P2" ? "p2" : "p3"}`}>{o.priority}</span> : "-"}</td>
                  <td>{o.escalated ? <span className="chip esc"><Icon name="alert" size={11} /> {o.route}</span> : <span style={{ color: "var(--text-dim)" }}>{o.route}</span>}</td>
                  <td className="mono">{o.confidence ? `${(o.confidence * 100).toFixed(0)}%` : "-"}</td>
                  <td className="check-cell">{o.drafted ? <Icon name="check" size={14} /> : "-"}</td>
                  <td className="mono">{(o.totalMs / 1000).toFixed(1)}s</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
