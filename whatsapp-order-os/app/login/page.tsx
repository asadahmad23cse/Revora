"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveAuth, API_BASE } from "@/lib/auth";

type LoginResponse = {
  token?: string;
  businessId?: string;
  error?: string;
  code?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as LoginResponse;
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : `Login failed (${res.status})`);
        return;
      }
      if (!data.token || !data.businessId) {
        setError("Invalid response from server.");
        return;
      }
      saveAuth(data.token, data.businessId);
      router.replace("/admin");
    } catch {
      setError("Could not reach the server. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 py-12 text-white [font-family:var(--font-inter),system-ui,sans-serif]">
      <div className="dot-grid-bg mx-auto max-w-md rounded-2xl border border-white/10 bg-[#030711] p-8 shadow-[0_0_40px_rgba(0,255,136,0.06)]">
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight">
          <span className="gradient-text">Revora</span>
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">Sign in to your admin dashboard</p>

        {error ? (
          <p className="glass-red mb-6 rounded-xl border border-red-500/40 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass w-full rounded-lg border border-white/10 bg-[#0a1628] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00ff88]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/30"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass w-full rounded-lg border border-white/10 bg-[#0a1628] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00ff88]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/30"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          No account?{" "}
          <Link href="/register" className="font-medium text-[#00ff88] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
