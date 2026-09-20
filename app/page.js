"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Globe2, ShieldCheck } from "lucide-react";
import "./globals.css";

export default function Home() {
  const router = useRouter();
  return (
    <main>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-mark">T</span>
          TraceLink
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#privacy">Privacy</a>
        </div>

        <div className="nav-account-actions">
          <a href="/login" className="nav-login">Sign in</a>
          <a href="/signup" className="nav-button">Start free</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <motion.div
          className="hero-glow"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
          }}
        />

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="eyebrow">
            <span className="status-dot" />
            Built for focused teams
          </div>

          <h1>
            Turn every click into
            <span> useful insight.</span>
          </h1>

          <p>
            Create beautiful trackable links and understand how people
            interact with them — without complicated analytics.
          </p>

          <div className="hero-actions">
            <button
  className="primary-button"
  onClick={() => router.push("/signup")}
>
  Create your first link
  <ArrowRight size={18} />
</button>

            <a href="/signup" className="secondary-button">
              Create an account
            </a>
          </div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          className="dashboard-preview"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8 }}
        >
          <div className="preview-top">
            <div>
              <small>OVERVIEW</small>
              <h3>Link performance</h3>
            </div>

            <div className="live-badge">
              <span />
              Live
            </div>
          </div>

          <div className="preview-stats">
            <div>
              <span>Total visits</span>
              <strong>12,842</strong>
              <small className="positive">+18.4%</small>
            </div>

            <div>
              <span>Unique visitors</span>
              <strong>8,421</strong>
              <small className="positive">+12.7%</small>
            </div>

            <div>
              <span>Countries</span>
              <strong>24</strong>
              <small>worldwide</small>
            </div>
          </div>

          <div className="chart">
            {[35, 48, 42, 65, 54, 72, 62, 84, 76, 91, 82, 96].map(
              (height, index) => (
                <motion.div
                  key={index}
                  className="chart-bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.5 + index * 0.04 }}
                />
              )
            )}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-heading">
          <span>BUILT FOR CLARITY</span>
          <h2>Everything you need. Nothing you don&apos;t.</h2>
        </div>

        <div className="feature-grid">
          <Feature
            icon={<BarChart3 />}
            title="Clear analytics"
            text="See visits, unique visitors, devices, browsers and traffic sources in one place."
          />

          <Feature
            icon={<Globe2 />}
            title="Understand your audience"
            text="See approximate geographic information and understand where your visitors come from."
          />

          <Feature
            icon={<ShieldCheck />}
            title="Privacy conscious"
            text="Collect useful analytics without pretending to know information a browser never exposes."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>Three steps. That&apos;s it.</h2>
        </div>

        <div className="steps">
          <Step number="01" title="Create a link" text="Paste your destination URL and create a unique TraceLink." />
          <Step number="02" title="Share it" text="Send your link anywhere — messages, social media or email." />
          <Step number="03" title="Understand" text="Watch visits and engagement appear in your dashboard." />
        </div>
      </section>

      {/* Footer */}
      <footer id="privacy">
        <div className="logo">
          <span className="logo-mark">T</span>
          TraceLink
        </div>
        <p>Simple analytics for every link.</p>
      </footer>
    </main>
  );
}

function Feature({ icon, title, text }) {
  return (
    <motion.div
      className="feature-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </motion.div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="step">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
