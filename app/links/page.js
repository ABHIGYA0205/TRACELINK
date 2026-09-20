"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Copy,
  ExternalLink,
  Link2,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";

export default function LinksPage() {
  const router = useRouter();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function fetchLinks() {
    try {
      setLoading(true);
      setRefreshing(true);

      const response = await fetch("/api/links", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load links"
        );
      }

      setLinks(data.links || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(fetchLinks, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function copyLink(slug) {
    const url =
      `${window.location.origin}/t/${slug}`;

    try {
      await navigator.clipboard.writeText(url);

      setCopied(slug);

      setTimeout(() => {
        setCopied("");
      }, 1500);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  }

  async function deleteLink(link) {
    if (!window.confirm(`Delete “${link.name || link.slug}”? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/links/${link.slug}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not delete link");
      setLinks((current) => current.filter((item) => item.slug !== link.slug));
    } catch (err) { setError(err.message); }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  if (loading) {
    return (
      <AuthGuard><main className="links-page">
        <div className="links-loading">
          <Activity size={20} />
          Loading your links...
        </div>
      </main></AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard><main className="links-page">
        <div className="links-error">
          <h2>Couldn&apos;t load links</h2>
          <p>{error}</p>

          <button
            onClick={fetchLinks}
            className="links-button"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main></AuthGuard>
    );
  }

  return (
    <AuthGuard><main className="links-page">

      <div className="links-container">

        {/* HEADER */}

        <header className="links-header">

          <div>
            <div className="links-eyebrow">
              TRACELINK
            </div>

            <h1>Your Links</h1>

            <p>
              Create, manage and analyze
              your tracked links.
            </p>
          </div>

          <div className="links-header-actions">

            <button
              onClick={fetchLinks}
              className="links-refresh"
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>

            <a
              href="/create"
              className="create-link-button"
            >
              <Plus size={16} />
              Create link
            </a>

            <button onClick={signOut} className="links-refresh logout-button" title="Sign out">
              <LogOut size={15} />
              Sign out
            </button>

          </div>

        </header>

        {/* SUMMARY */}

        <section className="links-summary">

          <div className="summary-item">
            <Link2 size={18} />

            <div>
              <span>Total links</span>
              <strong>{links.length}</strong>
            </div>
          </div>

          <div className="summary-item">
            <BarChart3 size={18} />

            <div>
              <span>Total visits</span>

              <strong>
                {links.reduce(
                  (total, link) =>
                    total + link.visits,
                  0
                )}
              </strong>
            </div>
          </div>

        </section>

        {/* LINKS */}

        <section className="links-list">

          {links.length === 0 ? (
            <div className="links-empty">

              <Link2 size={30} />

              <h2>No TraceLinks yet</h2>

              <p>
                Create your first tracked link
                to start collecting analytics.
              </p>

              <a
                href="/create"
                className="create-link-button"
              >
                <Plus size={16} />
                Create your first link
              </a>

            </div>
          ) : (
            links.map((link) => (
              <motion.article
                className="link-item"
                key={link._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >

                <div className="link-main">

                  <div className="link-icon">
                    <Link2 size={18} />
                  </div>

                  <div className="link-details">

                    <div className="link-name">
                      {link.name ||
                        "Untitled TraceLink"}
                    </div>

                    <div className="link-slug">
                      /t/{link.slug}
                    </div>

                    <a
                      href={link.destination}
                      target="_blank"
                      rel="noreferrer"
                      className="link-destination"
                    >
                      {link.destination}
                      <ExternalLink
                        size={12}
                      />
                    </a>

                  </div>

                </div>

                <div className="link-stats">

                  <div>
                    <span>VISITS</span>
                    <strong>
                      {link.visits}
                    </strong>
                  </div>

                  <div>
                    <span>CREATED</span>
                    <strong>
                      {formatDate(
                        link.createdAt
                      )}
                    </strong>
                  </div>

                </div>

                <div className="link-actions">

                  <button
                    onClick={() =>
                      copyLink(link.slug)
                    }
                    className="icon-button"
                    title="Copy TraceLink"
                  >
                    <Copy size={16} />

                    {copied === link.slug
                      ? "Copied"
                      : ""}
                  </button>

                  <a
                    href={`/t/${link.slug}`}
                    className="icon-button"
                    title="Open TraceLink"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} />
                  </a>

                  <button onClick={() => deleteLink(link)} className="icon-button delete-button" title="Delete link" aria-label={`Delete ${link.name || link.slug}`}><Trash2 size={16} /></button>

                  <a
                    href={`/dashboard?slug=${link.slug}`}
                    className="analytics-button"
                  >
                    Analytics
                    <ArrowUpRight
                      size={15}
                    />
                  </a>

                </div>

              </motion.article>
            ))
          )}

        </section>

      </div>

    </main></AuthGuard>
  );
}

function formatDate(date) {
  if (!date) {
    return "Unknown";
  }

  return new Date(date).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}
