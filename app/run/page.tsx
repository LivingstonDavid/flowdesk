"use client";

import { runWorkflow } from "@/lib/engine";
import { DATASET_NAME, TICKETS } from "@/lib/data/tickets";
import { STEP_META } from "@/lib/steps";
import { StepResult, Ticket, TicketRunStatus } from "@/lib/types";
import { useWorkflow } from "@/components/WorkflowProvider";
import Icon from "@/components/Icon";
import Link from "next/link";
import { useRef, useState } from "react";

export default function RunPage() {
  const { workflow, setLastRun } = useWorkflow();
  const [statuses, setStatuses] = useState<Record<string, TicketRunStatus>>({});
  const [results, setResults] = useState<Record<string, StepResult[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const runningRef = useRef(false);

  const startRun = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setStatuses({});
    setResults({});
    setDoneCount(0);
    setSelectedId(TICKETS[0].id);

    const collected: import("@/lib/types").TicketResult[] = [];
    await runWorkflow(TICKETS, workflow, {
      onTicketStart: (t: Ticket) => {
        setStatuses((s) => ({ ...s, [t.id]: "running" }));
        setSelectedId(t.id);
        setActiveStep(null);
      },
      onStepDone: (t: Ticket, r: StepResult) => {
        setResults((m) => ({ ...m, [t.id]: [...(m[t.id] ?? []), r] }));
      },
      onTicketDone: (r) => {
        collected.push(r);
        setStatuses((s) => ({ ...s, [r.ticket.id]: "done" }));
        setDoneCount((n) => n + 1);
      },
    });
    setLastRun(collected);
    setRunning(false);
    runningRef.current = false;
  };

  const selected = TICKETS.find((t) => t.id === selectedId) ?? null;
  const selectedSteps = selected ? results[selected.id] ?? [] : [];
  const selectedStatus: TicketRunStatus = selected ? statuses[selected.id] ?? "pending" : "pending";
  const started = Object.keys(statuses).length > 0;
  const finishedAll = doneCount === TICKETS.length;

  return (
    <main className="page">
      <div className="page-head">
        <h1 className="page-title">Live run</h1>
        <p className="page-sub">
          Dataset: <strong>{DATASET_NAME}</strong> ({TICKETS.length} tickets) - workflow: <strong>{workflow.name}</strong> ({workflow.steps.length} steps)
        </p>
      </div>

      <div className="run-controls">
        <button className="btn" onClick={startRun} disabled={running || workflow.steps.length === 0}>
          {running ? "Running…" : started ? "↻ Run again" : "▶ Run workflow"}
        </button>
        <div className="run-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(doneCount / TICKETS.length) * 100}%` }} />
          </div>
          <div className="progress-label">
            <span>{doneCount} / {TICKETS.length} tickets processed</span>
            <span>{finishedAll ? "run complete" : running ? activeStep ?? "processing…" : "idle"}</span>
          </div>
        </div>
        {finishedAll && <Link href="/dashboard" className="btn btn-ghost btn-sm">View dashboard →</Link>}
      </div>

      <div className="run-grid">
        <div className="ticket-list">
          <div className="ticket-list-head">
            <span>Ticket queue</span>
            <span>{doneCount} done</span>
          </div>
          <div className="ticket-list-scroll">
            {TICKETS.map((t) => {
              const st = statuses[t.id] ?? "pending";
              return (
                <button
                  key={t.id}
                  className={`ticket-row ${st} ${selectedId === t.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <span className="ticket-id">{t.id}</span>
                  <span className="ticket-subject">{t.subject}</span>
                  <span className={`ticket-status st-${st}`}>{st === "done" ? "✓ done" : st}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="inspector">
          {!selected && (
            <div className="inspector-empty">
              <Icon name="ticket" size={40} />
              <p>Select a ticket to inspect it - or hit <strong>Run workflow</strong> and watch them process.</p>
            </div>
          )}
          {selected && (
            <>
              <div className="insp-head">
                <h2 className="insp-subject">{selected.subject}</h2>
                <div className="insp-meta">
                  <span className="chip">{selected.customer} · {selected.company}</span>
                  <span className="chip">{selected.channel}</span>
                  {selected.vip && <span className="chip vip">VIP</span>}
                  {selected.sentiment !== "calm" && <span className="chip">{selected.sentiment}</span>}
                  {selectedSteps.filter((s) => s.confidence).map((s) => {
                    const m = s.title.match(/^Classified: (.+)$/);
                    return m ? <span key={s.stepId} className="chip cat">{m[1]}</span> : null;
                  })}
                </div>
              </div>
              <div className="insp-body">{selected.body}</div>
              <div className="step-results">
                {selectedSteps.map((s) => (
                  <div key={s.stepId} className="step-result">
                    <div className="step-result-head">
                      <span className="step-result-icon"><Icon name={STEP_META[s.stepType].icon} size={16} /></span>
                      {s.title}
                      <span className="step-result-time">{s.durationMs}ms</span>
                    </div>
                    <div className={`step-result-detail ${s.stepType === "draft_reply" ? "reply" : ""}`}>{s.detail}</div>
                    {s.confidence !== undefined && (
                      <div className="conf-bar">
                        <div className="conf-track"><div className="conf-fill" style={{ width: `${s.confidence * 100}%` }} /></div>
                        <span className="conf-label">confidence {(s.confidence * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                ))}
                {selectedStatus === "running" && selectedSteps.length < workflow.steps.length && (
                  <div className="step-active">
                    <span className="spinner" />
                    {STEP_META[workflow.steps[selectedSteps.length].type].name}…
                  </div>
                )}
                {selectedStatus === "pending" && selectedSteps.length === 0 && (
                  <div className="step-active" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                    Waiting in queue…
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
