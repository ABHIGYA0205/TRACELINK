"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound, Mail, UserRound } from "lucide-react";

export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const next = searchParams.get("next") || "/links";

  async function submit(event) {
    event.preventDefault();
    setError(""); setLoading(true);
    try {
      const response = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong.");
      router.replace(next.startsWith("/") ? next : "/links");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return <main className="auth-page"><div className="auth-shell">
    <Link href="/" className="auth-brand"><span className="logo-mark">T</span>TraceLink</Link>
    <section className="auth-card">
      <span className="auth-kicker">{isSignup ? "START FOR FREE" : "WELCOME BACK"}</span>
      <h1>{isSignup ? "Create your workspace" : "Sign in to TraceLink"}</h1>
      <p>{isSignup ? "Keep your links and analytics private, organized, and ready when you are." : "Your links and insights are waiting for you."}</p>
      <form onSubmit={submit} className="auth-form">
        {isSignup && <label>Name<div className="auth-input"><UserRound size={17} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required autoComplete="name" /></div></label>}
        <label>Email address<div className="auth-input"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required autoComplete="email" /></div></label>
        <label>Password<div className="auth-input"><KeyRound size={17} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? "At least 8 characters" : "Your password"} required minLength={isSignup ? 8 : undefined} autoComplete={isSignup ? "new-password" : "current-password"} /></div></label>
        {error && <div className="form-error">{error}</div>}
        <button className="auth-submit" disabled={loading}>{loading ? "Please wait..." : isSignup ? "Create account" : "Sign in"}<ArrowRight size={17} /></button>
      </form>
      <p className="auth-switch">{isSignup ? "Already have an account?" : "New to TraceLink?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
    </section>
  </div></main>;
}
