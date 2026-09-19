"use client";

import { STEP_CATALOG, STEP_META } from "@/lib/steps";
import { StepType, WorkflowStep } from "@/lib/types";
import { useWorkflow } from "@/components/WorkflowProvider";
import Icon from "@/components/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BuilderPage() {
  const { workflow, addStep, removeStep, moveStep, reorderStep, updateConfig, setName } = useWorkflow();
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const router = useRouter();

  // --- palette -> canvas drop ---
  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const type = e.dataTransfer.getData("flowdesk/step-type") as StepType;
    if (type) addStep(type);
    setDragIndex(null);
  };

  // --- node reorder drop ---
  const onNodeDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (dragIndex !== null) reorderStep(dragIndex, index);
    setDragIndex(null);
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Workflow builder</h1>
          <p className="page-sub">
            Trigger: <strong>new ticket created</strong> - compose the steps every ticket flows through. Drag from the palette or click +.
          </p>
        </div>
        <span className="chip"><span className="save-dot" /> Autosaved locally</span>
      </div>
      <div className="builder-grid">
        <aside className="palette panel">
          <h3>Step palette</h3>
          <p className="palette-hint">Drag onto the canvas, or click +</p>
          {STEP_CATALOG.map((s) => (
            <div
              key={s.type}
              className="palette-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("flowdesk/step-type", s.type)}
              onClick={() => addStep(s.type)}
              role="button"
              tabIndex={0}
            >
              <span className={`tile tile-${s.type}`} style={{ width: 26, height: 26 }}>
                <Icon name={s.icon} size={14} />
              </span>
              <span style={{ minWidth: 0 }}>
                <div className="pn">{s.name}</div>
                <div className="pb">{s.blurb}</div>
              </span>
              <span className="padd">+</span>
            </div>
          ))}
        </aside>

        <section
          className={`canvas ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onCanvasDrop}
        >
          <div className="flow-rail">
            <div className="flow-node trigger">
              <div className="node-head">
                <span className="tile tile-trigger"><Icon name="bolt" size={15} /></span>
                <span className="node-titles">
                  <div className="node-title">New ticket created</div>
                  <div className="node-kind">Trigger - runs on every incoming ticket</div>
                </span>
                <span className="chip ok" style={{ marginLeft: "auto" }}>always on</span>
              </div>
            </div>

            {workflow.steps.length === 0 && (
              <div className="canvas-empty">No steps yet - drag a step from the palette to start building.</div>
            )}

            {workflow.steps.map((step, i) => (
              <StepNode
                key={step.id}
                step={step}
                index={i}
                total={workflow.steps.length}
                onMove={moveStep}
                onRemove={removeStep}
                onConfig={updateConfig}
                onDragStart={() => setDragIndex(i)}
                onDragEnd={() => setDragIndex(null)}
                onDrop={onNodeDrop}
                dragging={dragIndex === i}
              />
            ))}
          </div>

          <div className="builder-bar">
            <input
              className="workflow-name"
              value={workflow.name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Workflow name"
            />
            <span className="builder-meta">
              <span className="save-dot" />
              {workflow.steps.length} step{workflow.steps.length === 1 ? "" : "s"} · saved to this browser
            </span>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
            <button
              className="btn"
              disabled={workflow.steps.length === 0}
              onClick={() => router.push("/run")}
            >
              Run workflow <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function StepNode({
  step,
  index,
  total,
  onMove,
  onRemove,
  onConfig,
  onDragStart,
  onDragEnd,
  onDrop,
  dragging,
}: {
  step: WorkflowStep;
  index: number;
  total: number;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onConfig: (id: string, key: string, value: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  dragging: boolean;
}) {
  const meta = STEP_META[step.type];
  return (
    <div
      className={`flow-node ${dragging ? "dragging" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => onDrop(e, index)}
    >
      <div className="node-head">
        <span className="node-grip" title="Drag to reorder"><Icon name="grip" size={15} /></span>
        <span className={`tile tile-${step.type}`}><Icon name={meta.icon} size={15} /></span>
        <span className="node-titles">
          <div className="node-title">{meta.name}</div>
          <div className="node-kind">Step {index + 1} of {total}</div>
        </span>
        <span className="node-actions">
          <button className="icon-btn" title="Move up" disabled={index === 0} onClick={() => onMove(step.id, -1)}>↑</button>
          <button className="icon-btn" title="Move down" disabled={index === total - 1} onClick={() => onMove(step.id, 1)}>↓</button>
          <button className="icon-btn danger" title="Remove step" onClick={() => onRemove(step.id)}>✕</button>
        </span>
      </div>
      <div className="node-body">
        <div className="node-config">
          {meta.fields.map((f) => (
            <div className="config-field" key={f.key}>
              <label>{f.label}</label>
              <select value={step.config[f.key] ?? f.options[0].value} onChange={(e) => onConfig(step.id, f.key, e.target.value)}>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
