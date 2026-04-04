"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API = "http://localhost:8080";

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
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [messages, setMessages] = useState<LeadMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [textarea, setTextarea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const [lr, mr] = await Promise.all([
        fetch(`${API}/api/leads/${id}`),
        fetch(`${API}/api/leads/${id}/messages`),
      ]);
      if (lr.status === 404) {
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
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleGenerate() {
    if (!lead) return;
    setGenerating(true);
    setBanner(null);
    try {
      const res = await fetch(`${API}/ai/generate-message`, {
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
      setBanner("Could not generate message.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!lead || !textarea.trim()) return;
    setSending(true);
    setBanner(null);
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
      const res = await fetch(`${API}/dev/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, content }),
      });
      if (!res.ok) {
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        setBanner("Send failed. Dev API must be running with NODE_ENV=development.");
        return;
      }
      const data: { timestamp?: string } = await res.json();
      setBanner("Message sent (simulated)");
      if (data.timestamp) {
        setMessages((m) =>
          m.map((x) =>
            x.id === optimistic.id
              ? { ...x, created_at: data.timestamp ?? x.created_at }
              : x,
          ),
        );
      }
      void load();
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setBanner("Send failed.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-slate-400">Loading…</div>
    );
  }

  if (notFound || !lead) {
    return (
      <div className="p-8">
        <p className="text-slate-400">Lead not found.</p>
        <Link href="/admin" className="btn-ghost mt-4 inline-block rounded-lg px-4 py-2 text-sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const maxFollowups = 10;
  const progress = Math.min(100, (lead.followup_count / maxFollowups) * 100);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mb-6">
        <Link href="/admin" className="btn-ghost inline-flex rounded-lg px-3 py-1.5 text-xs text-slate-400">
          ← Dashboard
        </Link>
      </div>

      {banner ? (
        <p className="glass-green mb-6 rounded-xl border border-emerald-500/30 px-4 py-3 text-sm text-emerald-200">{banner}</p>
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
            <p className="text-slate-200">
              {lead.next_followup_at ? relativeTime(lead.next_followup_at) : "—"}
            </p>
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
