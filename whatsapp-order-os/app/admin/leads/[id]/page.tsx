"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { apiFetch, clearAuth } from "@/lib/auth";

type LeadDetail = {
  id: string;
  name: string;
  phone_number: string;
  source: string;
  status: string;
  followup_count: number;
  next_followup_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

type LeadMsg = {
  id: string;
  content: string;
  status: string;
  source: string;
  created_at: string;
};

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60000) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < 3600000) return rtf.format(Math.round(diff / 60000), "minute");
  if (abs < 86400000) return rtf.format(Math.round(diff / 3600000), "hour");
  return rtf.format(Math.round(diff / 86400000), "day");
}

function sourceTagClass(source: string): string {
  if (source === "worker_auto") return "bg-amber-500/15 text-amber-300 border-amber-500/35";
  if (source === "ai_generated") return "bg-violet-500/15 text-violet-300 border-violet-500/35";
  return "bg-slate-500/15 text-slate-300 border-slate-500/35";
}

export default function AdminLeadDetailPage() {
  return (
    <AuthGuard>
      <AdminLeadDetailInner />
    </AuthGuard>
  );
}

type ToastState = { kind: "ok" | "err"; message: string } | null;

function AdminLeadDetailInner() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [messages, setMessages] = useState<LeadMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [textarea, setTextarea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const [lr, mr] = await Promise.all([apiFetch(`/api/leads/${id}`), apiFetch(`/api/leads/${id}/messages`)]);
      if (lr.status === 401 || mr.status === 401) {
        clearAuth();
        router.replace("/login");
        return;
      }
      if (lr.status === 404 || lr.status === 403) {
        setNotFound(true);
        setLead(null);
        setMessages([]);
        return;
      }
      if (!lr.ok || !mr.ok) throw new Error("fetch failed");
      const lj: { lead?: LeadDetail } = await lr.json();
      const mj: { messages?: LeadMsg[] } = await mr.json();
      setLead(lj.lead ?? null);
      setMessages(mj.messages ?? []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const mr = await apiFetch(`/api/leads/${id}/messages`);
      if (mr.status === 401) {
        clearAuth();
        router.replace("/login");
        return;
      }
      if (!mr.ok) return;
      const mj: { messages?: LeadMsg[] } = await mr.json();
      setMessages(mj.messages ?? []);
    } catch {
      /* ignore */
    }
  }, [id, router]);

  async function handleGenerate() {
    if (!lead) return;
    setGenerating(true);
    setToast(null);
    try {
      const res = await apiFetch("/ai/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          business_type: "food business",
          status: lead.status,
        }),
      });
      const data: { message?: string } = await res.json();
      setTextarea(data.message ?? "");
    } catch {
      setToast({ kind: "err", message: "Could not generate message." });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!lead || !textarea.trim()) return;
    setSending(true);
    setToast(null);
    const content = textarea.trim();
    const optimistic: LeadMsg = {
      id: `temp-${Date.now()}`,
      content,
      status: "sent (simulated)",
      source: "manual",
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const res = await apiFetch("/dev/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, content }),
      });
      if (!res.ok) {
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        setToast({
          kind: "err",
          message:
            typeof errBody.error === "string"
              ? errBody.error
              : "Send failed. Dev API must be running with NODE_ENV=development.",
        });
        return;
      }
      setToast({ kind: "ok", message: "Message sent (simulated)" });
      await loadMessages();
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setToast({ kind: "err", message: "Send failed." });
    } finally {
      setSending(false);
    }
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-slate-400">Loading…</div>
    );
  }

  if (notFound || !lead) {
    return (
      <div className="min-h-screen p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link href="/admin" className="btn-ghost inline-block rounded-lg px-4 py-2 text-sm">
            Back to dashboard
          </Link>
          <button type="button" className="btn-ghost rounded-lg px-4 py-2 text-xs" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <p className="text-slate-400">Lead not found or you don&apos;t have access.</p>
      </div>
    );
  }

  const maxFollowups = 10;
  const progress = Math.min(100, (lead.followup_count / maxFollowups) * 100);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="btn-ghost inline-flex rounded-lg px-3 py-1.5 text-xs text-slate-400">
          ← Dashboard
        </Link>
        <button type="button" className="btn-ghost rounded-lg px-4 py-2 text-xs font-medium" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {toast ? (
        <div
          className={`fixed bottom-6 left-1/2 z-[100] max-w-md -translate-x-1/2 rounded-xl border px-5 py-3 text-sm shadow-lg backdrop-blur-md ${
            toast.kind === "ok"
              ? "border-[#00ff88]/40 bg-[#0a1628]/95 text-[#00ff88]"
              : "border-red-500/40 bg-[#0a1628]/95 text-red-300"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass space-y-4 rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white">Lead</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-100">{lead.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-slate-100">{lead.phone_number}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Source</dt>
              <dd className="text-slate-100">{lead.source}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="text-slate-100">{lead.status}</dd>
            </div>
          </dl>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">Follow-up count</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-500/80 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {lead.followup_count} recorded (bar scales up to {maxFollowups})
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Next follow-up</p>
            <p className="text-slate-200">{lead.next_followup_at ? relativeTime(lead.next_followup_at) : "—"}</p>
          </div>
        </div>

        <div className="glass flex max-h-[min(70vh,520px)] flex-col rounded-xl border border-white/10">
          <h2 className="border-b border-white/10 p-4 text-lg font-semibold text-white">Messages</h2>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No messages yet — send the first one below.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-lg border border-emerald-500/25 bg-[#0a1628] px-4 py-3 text-emerald-100"
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <time dateTime={msg.created_at}>{new Date(msg.created_at).toLocaleString("en-IN")}</time>
                    <span className="rounded border border-white/15 px-1.5 py-0.5 text-slate-300">{msg.status}</span>
                    <span className={`rounded border px-1.5 py-0.5 ${sourceTagClass(msg.source)}`}>{msg.source}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass-green mt-8 space-y-4 rounded-xl border border-emerald-500/20 p-6">
        <button
          type="button"
          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          disabled={generating}
          onClick={() => void handleGenerate()}
        >
          {generating ? "Generating…" : "Generate AI Message"}
        </button>
        <textarea
          className="glass w-full min-h-[120px] rounded-lg border border-white/10 bg-[#0a1628] p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          placeholder="AI draft or type your message…"
          value={textarea}
          onChange={(e) => setTextarea(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          disabled={sending || !textarea.trim()}
          onClick={() => void handleSend()}
        >
          {sending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </div>
  );
}
