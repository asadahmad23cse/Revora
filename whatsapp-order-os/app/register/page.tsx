"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveAuth, API_BASE } from "@/lib/auth";

type RegisterResponse = {
  token?: string;
  businessId?: string;
  error?: string;
  code?: string;
  details?: unknown;
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          business_name: businessName.trim(),
          phone: phone.trim(),
        }),
      });
      const data = (await res.json()) as RegisterResponse;
      if (!res.ok) {
        if (typeof data.error === "string") {
          setError(data.error);
        } else {
          setError(`Registration failed (${res.status})`);
        }
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
          <span className="gradient-text">Create account</span>
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">Register your business on Revora</p>

        {error ? (
          <p className="glass-red mb-6 rounded-xl border border-red-500/40 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Email
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass w-full rounded-lg border border-white/10 bg-[#0a1628] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00ff88]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/30"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="business" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Business name
            </label>
            <input
              id="business"
              name="business_name"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="glass w-full rounded-lg border border-white/10 bg-[#0a1628] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00ff88]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/30"
              placeholder="Your kitchen or brand name"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass w-full rounded-lg border border-white/10 bg-[#0a1628] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00ff88]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/30"
              placeholder="919876543210"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#00ff88] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
