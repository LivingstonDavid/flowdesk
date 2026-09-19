import Icon from "@/components/Icon";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-glow" />
        <span className="pill pill-cyan hero-kicker">
          <Icon name="shield" size={12} /> Portfolio demo - synthetic data only
        </span>
        <h1>
          Support workflows
          <br />
          that <span className="grad">run themselves</span>
        </h1>
        <p className="hero-sub">
          Flowdesk is a visual builder for agentic ITSM automation. Compose triage,
          reply-drafting, routing and escalation steps on a canvas - then watch the
          workflow chew through a live ticket queue, confidence scores and drafted
          replies included.
        </p>
        <div className="hero-cta">
          <Link href="/builder" className="btn">
            Open the builder <Icon name="arrowRight" size={15} />
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            See the impact dashboard
          </Link>
        </div>

        <div className="hero-preview">
          <div className="hp-chrome">
            <span />
            <span />
            <span />
          </div>
          <div className="hp-body">
            <div className="hp-rail">
              <div className="hp-node">
                <span className="tile tile-trigger"><Icon name="bolt" size={13} /></span>
                <span>
                  <div className="hp-node-name">New ticket created</div>
                  <div className="hp-node-sub">trigger · NB-1051</div>
                </span>
              </div>
              <div className="hp-node">
                <span className="tile tile-classify"><Icon name="tag" size={13} /></span>
                <span>
                  <div className="hp-node-name">Classify ticket</div>
                  <div className="hp-node-sub">Billing · 94% confidence</div>
                </span>
              </div>
              <div className="hp-node">
                <span className="tile tile-draft_reply"><Icon name="pen" size={13} /></span>
                <span>
                  <div className="hp-node-name">Draft reply</div>
                  <div className="hp-node-sub">ready for agent review</div>
                </span>
              </div>
              <div className="hp-node">
                <span className="tile tile-route"><Icon name="branch" size={13} /></span>
                <span>
                  <div className="hp-node-name">Route &amp; escalate</div>
                  <div className="hp-node-sub">Billing Ops · no escalation</div>
                </span>
              </div>
            </div>
            <div className="hp-dash">
              <div className="hp-stat-row">
                <span>
                  <div className="hp-stat-num">21</div>
                  <div className="hp-stat-lbl">Processed</div>
                </span>
                <span>
                  <div className="hp-stat-num">3.9h</div>
                  <div className="hp-stat-lbl">Manual time saved</div>
                </span>
                <span>
                  <div className="hp-stat-num">92%</div>
                  <div className="hp-stat-lbl">Avg confidence</div>
                </span>
              </div>
              <div className="hp-bars">
                <div className="hp-bar" style={{ height: "38%" }} />
                <div className="hp-bar" style={{ height: "62%" }} />
                <div className="hp-bar alt" style={{ height: "47%" }} />
                <div className="hp-bar" style={{ height: "78%" }} />
                <div className="hp-bar alt" style={{ height: "55%" }} />
                <div className="hp-bar" style={{ height: "90%" }} />
                <div className="hp-bar alt" style={{ height: "66%" }} />
                <div className="hp-bar" style={{ height: "72%" }} />
                <div className="hp-bar alt" style={{ height: "100%" }} />
                <div className="hp-bar" style={{ height: "84%" }} />
              </div>
              <div className="hp-caption">tickets processed / min · live run</div>
            </div>
          </div>
        </div>
      </section>

      <div className="metric-strip">
        <div className="metric-item">
          <div className="metric-num">21</div>
          <div className="metric-lbl">synthetic tickets</div>
        </div>
        <div className="metric-item">
          <div className="metric-num">5</div>
          <div className="metric-lbl">composable steps</div>
        </div>
        <div className="metric-item">
          <div className="metric-num">8</div>
          <div className="metric-lbl">category taxonomy</div>
        </div>
        <div className="metric-item">
          <div className="metric-num">0</div>
          <div className="metric-lbl">external API calls</div>
        </div>
      </div>

      <section className="feature-grid">
        <div className="feature-card">
          <span className="tile tile-classify"><Icon name="grid" size={17} /></span>
          <h3>Visual workflow canvas</h3>
          <p>
            Drag steps onto the canvas, reorder them, tune each step&apos;s config. The
            flow is data - not code - so it can be saved, versioned and edited by
            non-developers.
          </p>
        </div>
        <div className="feature-card">
          <span className="tile tile-route"><Icon name="bolt" size={17} /></span>
          <h3>Watch it execute live</h3>
          <p>
            Run the workflow over a queue of support tickets and watch each one flow
            through the steps in real time: classification with confidence, drafted
            reply, routing decision.
          </p>
        </div>
        <div className="feature-card">
          <span className="tile tile-draft_reply"><Icon name="chart" size={17} /></span>
          <h3>Prove the impact</h3>
          <p>
            A results dashboard turns the run into numbers a manager cares about:
            tickets processed, hours of manual work saved, category and routing
            breakdowns.
          </p>
        </div>
      </section>

      <p className="landing-foot">
        Every ticket, reply and metric in this demo is fictional and generated locally.
        No external APIs, no real customer data.
        <br />
        Designed and built by{" "}
        <a href="https://rdavidlivingston.com" target="_blank" rel="noreferrer">
          David Livingston
        </a>{" "}
        as a portfolio demonstration.
      </p>
    </main>
  );
}
