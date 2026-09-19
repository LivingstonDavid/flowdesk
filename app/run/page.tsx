"use client";

import { runWorkflow } from "@/lib/engine";
import { DATASET_NAME, TICKETS } from "@/lib/data/tickets";
import { STEP_META } from "@/lib/steps";
import { StepResult, Ticket, TicketRunStatus } from "@/lib/types";
import { useWorkflow } from "@/components/WorkflowProvider";
import Icon from "@/components/Icon";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const CHANNEL_ICON: Record<string, string> = { email: "mail", chat: "megaphone", portal: "globe", api: "cpu" };

export default function RunPage() {
  const { workflow, setLastRun } = useWorkflow();
  const [statuses, setStatuses] = useState<Record<string, TicketRunStatus>>({});
  const [results, setResults] = useState<Record<string, StepResult[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const runningRef = useRef(false);
  const t0Ref = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(Date.now() - t0Ref.current), 100);
    return () => clearInterval(id);
  }, [running]);

  const startRun = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    t0Ref.current = Date.now();
    setElapsed(0);
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
    setElapsed(Date.now() - t0Ref.current);
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
        <div>
          <h1 className="page-title">Live run</h1>
          <p className="page-sub">
            Dataset: <strong>{DATASET_NAME}</strong> ({TICKETS.length} tickets) · workflow: <strong>{workflow.name}</strong> ({workflow.steps.length} steps)
          </p>
        </div>
        {finishedAll && <span className="chip ok"><Icon name="check" size={12} /> Run complete</span>}
      </div>

      <div className="run-controls panel">
        <button className="btn" onClick={startRun} disabled={running || workflow.steps.length === 0}>
          {running ? (
            <><span className="spinner" style={{ border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff" }} /> Running…</>
          ) : started ? (
            <><Icon name="refresh" size={14} /> Run again</>
          ) : (
            <><Icon name="play" size={13} /> Run workflow</>
          )}
        </button>
        <div className="run-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(doneCount / TICKETS.length) * 100}%` }} />
          </div>
          <div className="progress-label">
            <span>{doneCount} / {TICKETS.length} tickets processed</span>
            <span>{finishedAll ? "run complete" : running ? "processing…" : "idle"}</span>
          </div>
        </div>
        <span className="run-elapsed">{(elapsed / 1000).toFixed(1)}s</span>
        {finishedAll && <Link href="/dashboard" className="btn btn-ghost btn-sm">View dashboard <Icon name="arrowRight" size={13} /></Link>}
      </div>

      <div className="run-grid">
        <div className="ticket-list panel">
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
                  <span className="avatar sm">{initials(t.customer)}</span>
                  <span className="tr-main">
                    <span className="tr-subject">{t.subject}</span>
                    <span className="tr-meta">{t.id} · {t.customer} · {t.company}</span>
                  </span>
                  <span className={`status-pill st-${st}`}>{st === "done" ? "done" : st}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="inspector panel">
          {!selected && (
            <div className="inspector-empty">
              <Icon name="ticket" size={38} />
              <p>Select a ticket to inspect it - or hit <strong>Run workflow</strong> and watch them process.</p>
            </div>
          )}
          {selected && (
            <>
              <div className="insp-head">
                <h2 className="insp-subject">{selected.subject}</h2>
                <div className="insp-meta">
                  <span className="chip"><Icon name={CHANNEL_ICON[selected.channel] ?? "mail"} size={11} /> {selected.channel}</span>
                  <span className="chip">{selected.customer} · {selected.company}</span>
                  {selected.vip && <span className="chip vip">VIP</span>}
                  {selected.sentiment !== "calm" && <span className="chip p2">{selected.sentiment}</span>}
                  {selectedSteps.filter((s) => s.confidence).map((s) => {
                    const m = s.title.match(/^Classified: (.+)$/);
                    return m ? <span key={s.stepId} className="chip cat">{m[1]}</span> : null;
                  })}
                </div>
              </div>
              <div className="insp-body">
                <span className="from-line">{selected.customer} &lt;{selected.company}&gt; · {new Date(selected.receivedAt).toUTCString().slice(0, 22)} UTC</span>
                {selected.body}
              </div>
              <div className="timeline">
                {selectedSteps.map((s) => (
                  <div key={s.stepId} className="tl-item">
                    <div className="tl-rail">
                      <span className={`tile tile-${s.stepType}`} style={{ width: 26, height: 26 }}>
                        <Icon name={STEP_META[s.stepType].icon} size={13} />
                      </span>
                    </div>
                    <div className="tl-card">
                      <div className="tl-head">
                        {s.title}
                        <span className="tl-time">{s.durationMs}ms</span>
                      </div>
                      {s.stepType === "draft_reply" ? (
                        <div className="reply-card">
                          <div className="reply-card-head">
                            <Icon name="mail" size={12} />
                            To: {selected.customer.split(" ")[0].toLowerCase()}@{selected.company.toLowerCase().replace(/[^a-z]/g, "")}.example
                            <span className="chip">awaiting agent review</span>
                          </div>
                          <div className="reply-card-body">{s.detail}</div>
                        </div>
                      ) : (
                        <div className="tl-detail">{s.detail}</div>
                      )}
                      {s.confidence !== undefined && (
                        <div className="conf-bar">
                          <div className="conf-track"><div className="conf-fill" style={{ width: `${s.confidence * 100}%` }} /></div>
                          <span className="conf-label">confidence {(s.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
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
