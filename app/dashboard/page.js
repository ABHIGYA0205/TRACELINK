"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ExternalLink,
  Globe,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardPage() {
  return (
    <AuthGuard><Suspense fallback={<main className="analytics-page"><div className="analytics-loading"><Activity size={20} />Loading analytics...</div></main>}><DashboardContent /></Suspense></AuthGuard>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!slug) {
      setError("No TraceLink specified.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setRefreshing(true);

      const response = await fetch(
        `/api/links/${slug}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load analytics"
        );
      }

      setLink(data.link);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    const timer = window.setTimeout(fetchAnalytics, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAnalytics]);

  const analytics = useMemo(() => link?.analytics || [], [link]);
  const filteredAnalytics = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range + 1);
    cutoff.setHours(0, 0, 0, 0);
    return analytics.filter((item) => new Date(item.timestamp) >= cutoff);
  }, [analytics, range]);

  /* =========================
     UNIQUE VISITORS
  ========================= */

  const uniqueVisitors = useMemo(() => {
    return new Set(
      filteredAnalytics.map((item) => item.ip)
    ).size;
  }, [filteredAnalytics]);

  /* =========================
     DEVICE STATS
  ========================= */

  const deviceStats = useMemo(() => {
    const stats = {
      Desktop: 0,
      Mobile: 0,
      Tablet: 0,
    };

    filteredAnalytics.forEach((item) => {
      if (
        stats[item.device] !==
        undefined
      ) {
        stats[item.device]++;
      }
    });

    return stats;
  }, [filteredAnalytics]);

  /* =========================
     BROWSER STATS
  ========================= */

  const browserStats = useMemo(() => {
    return getStats(
      filteredAnalytics,
      "browser"
    );
  }, [filteredAnalytics]);

  /* =========================
     OS STATS
  ========================= */

  const osStats = useMemo(() => {
    return getStats(
      filteredAnalytics,
      "os"
    );
  }, [filteredAnalytics]);

  /* =========================
     REFERRER STATS
  ========================= */

  const referrerStats = useMemo(() => {
    return getStats(
      filteredAnalytics.map((item) => ({ ...item, referer: formatReferrer(item.referer) })),
      "referer"
    );
  }, [filteredAnalytics]);

  /* =========================
     DAILY TRAFFIC
  ========================= */

  const dailyStats = useMemo(() => {
    const stats = {};

    filteredAnalytics.forEach((item) => {
      const date = new Date(
        item.timestamp
      )
        .toISOString()
        .slice(0, 10);

      stats[date] =
        (stats[date] || 0) + 1;
    });

    return Object.entries(stats)
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .slice(-range);
  }, [filteredAnalytics, range]);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="analytics-page">
        <div className="analytics-loading">
          <Activity size={20} />
          Loading analytics...
        </div>
      </main>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <main className="analytics-page">
        <div className="analytics-error">
          <h2>
            Couldn&apos;t load analytics
          </h2>

          <p>{error}</p>

          <button
            onClick={fetchAnalytics}
            className="primary-button"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <main className="analytics-page">
      <div className="analytics-container">

        {/* HEADER */}

        <header className="analytics-header">
          <div>
            <a
              href="/create"
              className="back-link"
            >
              <ArrowLeft size={15} />
              Create another link
            </a>

            <div className="analytics-title-row">
              <div>
                <div className="eyebrow">
                  TRACE LINK
                </div>

                <h1>Analytics</h1>

                <p>
                  Understand how people
                  interact with your link.
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-controls">
          <div className="range-picker" aria-label="Analytics date range">
            {[7, 30].map((days) => <button key={days} className={range === days ? "active" : ""} onClick={() => setRange(days)}>{days}d</button>)}
          </div>
          <button
            className="refresh-button"
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
          </div>
        </header>

        {/* LINK BAR */}

        <section className="tracked-link">
          <div className="tracked-link-icon">
            <Globe size={19} />
          </div>

          <div className="tracked-link-info">
            <span>TRACKING LINK</span>

            <strong>
              /t/{link.slug}
            </strong>
          </div>

          <div className="tracked-destination">
            <span>DESTINATION</span>

            <a
              href={link.destination}
              target="_blank"
              rel="noreferrer"
            >
              {link.destination}
              <ExternalLink size={13} />
            </a>
          </div>
        </section>

        {/* STAT CARDS */}

        <motion.section className="analytics-stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <StatCard
            icon={<Activity size={19} />}
            label={`Visits · ${range}d`}
            value={filteredAnalytics.length}
          />

          <StatCard
            icon={<Users size={19} />}
            label="Unique visitors"
            value={uniqueVisitors}
          />

          <StatCard
            icon={<Monitor size={19} />}
            label="Desktop"
            value={deviceStats.Desktop}
          />

          <StatCard
            icon={<Smartphone size={19} />}
            label="Mobile"
            value={deviceStats.Mobile}
          />
        </motion.section>

        {/* TRAFFIC CHART */}

        <section className="analytics-panel">
          <div className="panel-header">
            <div>
              <div className="panel-eyebrow">
                TRAFFIC
              </div>

              <h2>Traffic overview</h2>

              <p>
              Traffic activity over the last {range} days
              </p>
            </div>

            <div className="panel-total">
              {filteredAnalytics.length}
              <span> visits</span>
            </div>
          </div>

          <VisitChart
            data={dailyStats}
          />
        </section>

        {/* BREAKDOWNS */}

        <section className="breakdown-grid">

          <BreakdownCard
            title="Browsers"
            icon={<Globe size={17} />}
            data={browserStats}
          />

          <BreakdownCard
            title="Operating systems"
            icon={<Monitor size={17} />}
            data={osStats}
          />

          <BreakdownCard
            title="Devices"
            icon={
              <Smartphone size={17} />
            }
            data={[
              [
                "Desktop",
                deviceStats.Desktop,
              ],
              [
                "Mobile",
                deviceStats.Mobile,
              ],
              [
                "Tablet",
                deviceStats.Tablet,
              ],
            ].filter(
              (item) => item[1] > 0
            )}
          />

          <BreakdownCard
            title="Referrers"
            icon={<Globe size={17} />}
            data={referrerStats}
          />

        </section>

        {/* ACTIVITY */}

        <section className="activity-panel">

          <div className="panel-header">
            <div>
              <h2>Recent activity</h2>

              <p>
                Latest visits to this
                TraceLink
              </p>
            </div>

            <Activity size={18} />
          </div>

          {filteredAnalytics.length === 0 ? (
            <div className="empty-analytics">
              No visits in this period. Share your TraceLink to start seeing activity.
            </div>
          ) : (
            <div className="activity-table">

              <div className="activity-row activity-head">
                <span>IP ADDRESS</span>
                <span>BROWSER</span>
                <span>OS</span>
                <span>DEVICE</span>
                <span>REFERRER</span>
                <span>TIME</span>
              </div>

              {filteredAnalytics
                .slice()
                .reverse()
                .slice(0, 20)
                .map(
                  (visit, index) => (
                    <div
                      className="activity-row"
                      key={`${visit.timestamp}-${index}`}
                    >
                      <span className="ip-address">
                        {visit.ip}
                      </span>

                      <span>
                        {visit.browser ||
                          "Unknown"}
                      </span>

                      <span>
                        {visit.os ||
                          "Unknown"}
                      </span>

                      <span className="device-cell">

                        {visit.device ===
                          "Mobile" && (
                          <Smartphone
                            size={14}
                          />
                        )}

                        {visit.device ===
                          "Tablet" && (
                          <Tablet
                            size={14}
                          />
                        )}

                        {visit.device ===
                          "Desktop" && (
                          <Monitor
                            size={14}
                          />
                        )}

                        {visit.device ||
                          "Unknown"}

                      </span>

                      <span className="activity-referrer">
                        {formatReferrer(visit.referer)}
                      </span>

                      <span className="activity-time">
                        {formatDate(
                          visit.timestamp
                        )}
                      </span>
                    </div>
                  )
                )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="analytics-stat-card">

      <div className="stat-card-icon">
        {icon}
      </div>

      <div className="stat-card-content">
        <span>{label}</span>

        <strong>{value}</strong>
      </div>

    </div>
  );
}

/* =========================
   BREAKDOWN CARD
========================= */

function BreakdownCard({
  title,
  icon,
  data,
}) {
  const total = data.reduce(
    (sum, [, value]) =>
      sum + value,
    0
  );

  return (
    <div className="breakdown-card">

      <div className="breakdown-header">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-breakdown">
          No data yet
        </div>
      ) : (
        <div className="breakdown-list">

          {data.map(
            ([name, value]) => {
              const percentage =
                total > 0
                  ? Math.round(
                      (value / total) *
                        100
                    )
                  : 0;

              return (
                <div
                  className="breakdown-item"
                  key={name}
                >

                  <div className="breakdown-top">
                    <span>{name}</span>

                    <strong>
                      {percentage}%
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}

/* =========================
   VISIT CHART
========================= */

function VisitChart({ data }) {
  const max = Math.max(
    ...data.map(
      ([, value]) => value
    ),
    1
  );

  return (
    <div className="traffic-chart">

      <div className="traffic-chart-y">
        <span>{max}</span>

        <span>
          {Math.ceil(max / 2)}
        </span>

        <span>0</span>
      </div>

      <div className="traffic-chart-main">

        <div className="traffic-grid">
          <span />
          <span />
          <span />
        </div>

        <div className="traffic-bars">

          {data.map(
            ([date, value]) => {
              const height =
                Math.max(
                  (value / max) *
                    100,
                  8
                );

              return (
                <div
                  className="traffic-column"
                  key={date}
                >

                  <div className="traffic-value">
                    {value}
                  </div>

                  <div className="traffic-track">

                    <div
                      className="traffic-fill"
                      style={{
                        height: `${height}%`,
                      }}
                    >

                      <div className="traffic-tooltip">
                        <strong>
                          {value}
                        </strong>

                        <span>
                          visits
                        </span>
                      </div>

                    </div>

                  </div>

                  <span className="traffic-date">
                    {formatChartDate(
                      date
                    )}
                  </span>

                </div>
              );
            }
          )}

        </div>
      </div>

    </div>
  );
}

/* =========================
   HELPERS
========================= */

function getStats(
  data,
  property
) {
  const counts = {};

  data.forEach((item) => {
    const value =
      item[property] ||
      "Unknown";

    counts[value] =
      (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .sort(
      (a, b) => b[1] - a[1]
    );
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "Unknown";
  }

  return new Date(
    timestamp
  ).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function formatChartDate(date) {
  const parsed = new Date(
    `${date}T00:00:00`
  );

  return parsed.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  );
}

function formatReferrer(referer) {
  if (!referer || referer === "Direct") return "Direct";
  try {
    return new URL(referer).hostname.replace(/^www\./, "");
  } catch {
    return referer;
  }
}
