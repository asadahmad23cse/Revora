"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API = "http://localhost:8080";

type LeadRow = {
  id: string;
  name: string;
  phone_number: string;
  source: string;
  status: string;
  followup_count: number;
  next_followup_at: string | null;
  created_at: string;
};

function businessTypeLabel(source: string): string {
  const m: Record<string, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    manual: "Manual",
  };
  return m[source] ?? source;
}

function statusBadgeClass(status: string): string {
  const c: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    contacted: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    onboarded: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    interested: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    trial: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    dropped: "bg-red-500/20 text-red-300 border-red-500/40",
  };
  return c[status] ?? "bg-slate-500/20 text-slate-300 border-slate-500/40";
}

function formatNextFollowup(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = t - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const mins = Math.round(abs / 60000);
  if (mins < 60) return rtf.format(Math.round(diff / 60000), "minute");
  const hrs = Math.round(abs / 3600000);
  if (hrs < 48) return rtf.format(Math.round(diff / 3600000), "hour");
  return rtf.format(Math.round(diff / 86400000), "day");
}

export default function AdminDashboardPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerBanner, setWorkerBanner] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API}/api/leads`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { leads?: LeadRow[] } = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      setError("Failed to load leads. Is the API running on :8080?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const stats = useMemo(() => {
    const now = Date.now();
    const total = leads.length;
    const due = leads.filter((l) => l.next_followup_at && new Date(l.next_followup_at).getTime() <= now).length;
    const active = leads.filter((l) => l.status === "active").length;
    const dropped = leads.filter((l) => l.status === "dropped").length;
    return { total, due, active, dropped };
  }, [leads]);

  async function handleLoadDemo() {
    setError(null);
    try {
      const res = await fetch(`${API}/dev/seed-demo`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadLeads();
    } catch {
      setError("Demo seed failed (dev server + NODE_ENV=development required).");
    }
  }

  async function handleRunFollowups() {
    setWorkerBanner(null);
    setError(null);
    try {
      const res = await fetch(`${API}/dev/run-worker`, { method: "POST" });
      const data: { processed?: number; leads?: { name: string; followup_count: number }[] } = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const n = data.processed ?? 0;
      setWorkerBanner(`Processed ${n} follow-up(s).`);
      await loadLeads();
    } catch {
      setError("Run follow-ups failed (API dev routes required).");
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          <span className="gradient-text">Revora Admin</span>
        </h1>
        <span className="glass-green w-fit rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300">
          Demo Mode
        </span>
      </header>

      {error ? (
        <p className="glass-red mb-6 rounded-xl border border-red-500/30 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : null}
      {workerBanner ? (
        <p className="glass-green mb-6 rounded-xl border border-emerald-500/30 px-4 py-3 text-sm text-emerald-200">
          {workerBanner}
        </p>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Leads", value: stats.total },
          { label: "Follow-ups Due", value: stats.due },
          { label: "Active Leads", value: stats.active },
          { label: "Dropped Leads", value: stats.dropped },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-white/10 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{s.value.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      <div className="mb-10 flex flex-wrap gap-3">
        <button type="button" className="btn-primary rounded-lg px-5 py-2.5 text-sm font-medium" onClick={() => void handleLoadDemo()}>
          Load Demo Data
        </button>
        <button type="button" className="btn-ghost rounded-lg px-5 py-2.5 text-sm font-medium" onClick={() => void handleRunFollowups()}>
          Run Follow-ups
        </button>
      </div>

      <div className="glass overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Business Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Follow-ups</th>
                <th className="px-4 py-3 font-medium">Next Follow-up</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No leads yet. Load demo data to populate.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-slate-100">{lead.name}</td>
                    <td className="px-4 py-3 text-slate-300">{businessTypeLabel(lead.source)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">{lead.followup_count}</td>
                    <td className="px-4 py-3 text-slate-400">{formatNextFollowup(lead.next_followup_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="btn-ghost inline-flex rounded-lg px-3 py-1.5 text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
