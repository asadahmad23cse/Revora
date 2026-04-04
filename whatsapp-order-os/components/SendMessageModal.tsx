"use client";

import { useEffect, useState } from "react";
import { apiFetch, getBusinessId } from "@/lib/auth";

type SendMessageModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function SendMessageModal({ open, onClose, onSuccess }: SendMessageModalProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhone("");
      setMessage("");
      setError(null);
      setSending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const businessId = getBusinessId();
    if (!businessId) {
      setError("Not signed in.");
      return;
    }
    const text = message.trim();
    const p = phone.trim();
    if (!p || !text) {
      setError("Phone and message are required.");
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch("/dev/simulate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: p, text, businessId }),
      });
      const data = (await res.json()) as { error?: string; queued?: boolean };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : `Request failed (${res.status})`);
        return;
      }
      onSuccess?.();
      onClose();
    } catch {
      setError("Could not reach the API.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="glass-strong w-full max-w-md rounded-xl border border-white/10 bg-[#0a1628] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-msg-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="send-msg-title" className="text-lg font-semibold text-white">
          Send WhatsApp Message
        </h2>
        <p className="mt-1 text-xs text-slate-400">Simulates an inbound customer message (dev API).</p>

        {error ? (
          <p className="glass-red mt-4 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300">{error}</p>
        ) : null}

        <form onSubmit={(e) => void handleSend(e)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="modal-phone" className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Phone number
            </label>
            <input
              id="modal-phone"
              type="text"
              autoComplete="tel"
              placeholder="919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass w-full rounded-lg border border-white/10 bg-[#030711] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00ff88]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/30"
            />
          </div>
          <div>
            <label htmlFor="modal-msg" className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-400">
              Message
            </label>
            <textarea
              id="modal-msg"
              rows={4}
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="glass w-full resize-y rounded-lg border border-white/10 bg-[#030711] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00ff88]/50 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/30"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost rounded-lg px-4 py-2 text-sm" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg border border-[#00ff88]/50 bg-[#00ff88]/10 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
