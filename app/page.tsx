import Icon from "@/components/Icon";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <span className="hero-kicker">Portfolio demo - synthetic data only</span>
        <h1>Build support workflows that run themselves</h1>
        <p>
          Flowdesk is a visual builder for agentic ITSM automation: compose triage, reply-drafting,
          routing and escalation steps on a canvas, then watch the workflow chew through a live
          ticket queue - classification, confidence scores, drafted replies and all.
        </p>
        <div className="hero-cta">
          <Link href="/builder" className="btn">Open the builder →</Link>
          <Link href="/dashboard" className="btn btn-ghost">See a results dashboard</Link>
        </div>
      </section>
      <section className="page">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="fi"><Icon name="grid" size={26} /></div>
            <h3>Visual workflow canvas</h3>
            <p>Drag steps onto the canvas, reorder them, tune each step&apos;s config. The flow is data - not code - so it can be saved, versioned and edited by non-developers.</p>
          </div>
          <div className="feature-card">
            <div className="fi"><Icon name="bolt" size={26} /></div>
            <h3>Watch it execute live</h3>
            <p>Run the workflow over a queue of support tickets and watch each one flow through the steps in real time: classification with confidence, drafted reply, routing decision.</p>
          </div>
          <div className="feature-card">
            <div className="fi"><Icon name="chart" size={26} /></div>
            <h3>Prove the impact</h3>
            <p>A results dashboard turns the run into numbers a manager cares about: tickets processed, hours of manual work saved, category and routing breakdowns.</p>
          </div>
        </div>
        <p className="landing-foot">
          Every ticket, reply and metric in this demo is fictional and generated locally. No external APIs, no real customer data.
        </p>
      </section>
    </main>
  );
}
