"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Link2,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import "../globals.css";
import AuthGuard from "@/components/AuthGuard";

export default function CreateLink() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [createdLink, setCreatedLink] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [copied, setCopied] =
    useState(false);
  const [error, setError] =
    useState("");

  async function handleCreate(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/links",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            destination: url,
            name,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not create link"
        );
      }

      setCreatedLink(
        data.link.slug
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to create link"
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    const link =
      `${window.location.origin}/t/${createdLink}`;

    await navigator.clipboard.writeText(
      link
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function createAnother() {
    setCreatedLink("");
    setUrl("");
    setName("");
    setError("");
    setCopied(false);
  }

  if (createdLink) {
    return (
      <AuthGuard><main className="create-page">

        <nav className="create-nav">

          <button
            className="back-button"
            onClick={() =>
              router.push("/")
            }
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="logo">
            <span className="logo-mark">
              T
            </span>

            TraceLink
          </div>

          <div />
        </nav>

        <section className="create-container">

          <div className="created-card">

            <div className="success-icon">
              <Check size={28} />
            </div>

            <span className="success-label">
              LINK CREATED
            </span>

            <h1>
              Your TraceLink is ready.
            </h1>

            <p>
              Share this link and visits
              will appear in your
              analytics dashboard.
            </p>

            <div className="generated-link">

              <div>
                <small>
                  YOUR LINK
                </small>

                <strong>
                  {window.location.origin}
                  /t/{createdLink}
                </strong>
              </div>

              <button
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <Check size={17} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={17} />
                    Copy
                  </>
                )}
              </button>

            </div>

            <div className="created-actions">

              <button
                className="primary-button"
                onClick={() =>
                  router.push(
                    `/dashboard?slug=${createdLink}`
                  )
                }
              >
                View analytics

                <ArrowRight
                  size={17}
                />
              </button>

              <button
                className="secondary-button"
                onClick={createAnother}
              >
                Create another
              </button>

            </div>

          </div>

        </section>

      </main></AuthGuard>
    );
  }

  return (
    <AuthGuard><main className="create-page">

      <nav className="create-nav">

        <button
          className="back-button"
          onClick={() =>
            router.push("/")
          }
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="logo">
          <span className="logo-mark">
            T
          </span>

          TraceLink
        </div>

        <div />
      </nav>

      <section className="create-container">

        <div className="create-heading">

          <div className="create-icon">
            <Link2 size={24} />
          </div>

          <span>
            CREATE A TRACKABLE LINK
          </span>

          <h1>
            Turn a URL into
            <br />
            <strong>
              useful data.
            </strong>
          </h1>

          <p>
            Create a unique link and
            start understanding how
            visitors interact with it.
          </p>

        </div>

        <form
          className="link-form"
          onSubmit={handleCreate}
        >

          <div className="input-group">

            <label>
              Destination URL
            </label>

            <div className="input-wrapper">

              <Link2 size={18} />

              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) =>
                  setUrl(e.target.value)
                }
                required
              />

            </div>

          </div>

          <div className="input-group">

            <label>
              Link name

              <span>
                Optional
              </span>
            </label>

            <input
              className="normal-input"
              type="text"
              placeholder="My campaign"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button
            className="create-submit"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Creating..."
              : "Create TraceLink"}

            {!loading && (
              <ArrowRight size={18} />
            )}

          </button>

        </form>

        <div className="privacy-note">
          <span>●</span>
          Your destination URL stays
          private.
        </div>

      </section>

    </main></AuthGuard>
  );
}
