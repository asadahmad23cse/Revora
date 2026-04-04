"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type OnboardContextValue = {
  openOnboardModal: () => void;
};

const OnboardContext = createContext<OnboardContextValue | null>(null);

export function useOnboardModal() {
  const ctx = useContext(OnboardContext);
  if (!ctx) {
    throw new Error("useOnboardModal must be used within OnboardModalProvider");
  }
  return ctx;
}

const SUCCESS_COPY =
  "Your free analysis has started. We will connect your WhatsApp shortly.";

function readErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return "Something went wrong. Please try again.";
}

function OnboardModalDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setPhone("");
    setLoading(false);
    setError(null);
    setSuccess(false);
    setToastVisible(false);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    const p = phone.trim();
    if (!n || !p) {
      setError("Please enter your name and phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, phone: p }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(readErrorMessage(data));
        return;
      }
      setSuccess(true);
      setToastVisible(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastVisible(false), 6000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
        aria-hidden
        onClick={loading ? undefined : onClose}
      />
      <div
        className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
        role="presentation"
      >
        <div
          className="pointer-events-auto w-full max-w-md glass-strong rounded-2xl border border-white/[0.08] p-6 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboard-title"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2
              id="onboard-title"
              className="text-lg font-bold text-white tracking-tight"
              style={{ fontFamily: "var(--font-space)" }}
            >
              Start free analysis
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-white text-sm disabled:opacity-50"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="glass-green rounded-xl px-4 py-4 border border-[#25D366]/20">
                <p className="text-sm text-slate-200 leading-relaxed">{SUCCESS_COPY}</p>
              </div>
              <button type="button" onClick={onClose} className="btn-primary w-full py-3 rounded-xl font-semibold text-white text-sm">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="onboard-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Name
                </label>
                <input
                  id="onboard-name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full glass px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#25D366]/40 transition-all duration-300 disabled:opacity-60"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="onboard-phone" className="block text-xs font-medium text-slate-400 mb-1.5">
                  Phone number
                </label>
                <input
                  id="onboard-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="w-full glass px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#25D366]/40 transition-all duration-300 disabled:opacity-60"
                  placeholder="WhatsApp number"
                />
              </div>
              {error ? (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
              >
                {loading ? "Submitting…" : "Submit"}
              </button>
            </form>
          )}
        </div>
      </div>

      {toastVisible ? (
        <div
          className="fixed bottom-6 left-1/2 z-[202] -translate-x-1/2 max-w-[min(90vw,28rem)] pointer-events-none"
          role="status"
        >
          <div className="glass-green rounded-xl px-4 py-3 border border-[#25D366]/30 shadow-lg">
            <p className="text-xs font-semibold text-[#25D366] text-center">{SUCCESS_COPY}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function OnboardModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openOnboardModal = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openOnboardModal }), [openOnboardModal]);

  return (
    <OnboardContext.Provider value={value}>
      {children}
      <OnboardModalDialog open={open} onClose={() => setOpen(false)} />
    </OnboardContext.Provider>
  );
}
