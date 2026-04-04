"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

/* ── Floating message data ── */
const incomingMessages = [
  { id: 1, text: "Bhai 2 paneer butter masala bhejo aaj 🙏", time: "11:03", name: "Kavita S." },
  { id: 2, text: "Usual order please, same address", time: "11:07", name: "Rahul M." },
  { id: 3, text: "1 kg daal makhani + 6 roti lunch ke liye", time: "11:09", name: "Priya D." },
  { id: 4, text: "Aaj ka lunch ready hai?", time: "11:12", name: "Arjun V." },
  { id: 5, text: "3 tiffin order karna hai weekly", time: "11:15", name: "Sunita R." },
];

/* ── AI capture steps ── */
const captureSteps = [
  { label: "Intent Detected", sub: "ORDER", color: "#25D366", icon: "🎯" },
  { label: "Extracting Fields", sub: "item · qty · address", color: "#00e5ff", icon: "⚡" },
  { label: "Confidence: 94%", sub: "Auto-confirm eligible", color: "#3b82f6", icon: "🔮" },
  { label: "Order Confirmed", sub: "Customer notified", color: "#25D366", icon: "✓" },
];

function RupeeParticle({ x, delay, drift }: { x: number; delay: number; drift: number }) {
  return (
    <motion.div
      initial={{ y: 0, x, opacity: 1, scale: 1 }}
      animate={{ y: -110, opacity: 0, scale: 0.2, x: x + drift }}
      transition={{ duration: 2.6, delay, ease: "easeOut" }}
      className="absolute bottom-8 text-sm font-bold text-[#25D366] pointer-events-none select-none"
      style={{ textShadow: "0 0 12px rgba(37,211,102,0.9)" }}
    >
      ₹
    </motion.div>
  );
}

function FloatingWhatsAppPanel() {
  const [activeStep, setActiveStep] = useState(0);
  // msgCount: how many messages are visible (1–5). cycleId: increments on each reset.
  // Both are plain numbers — NO side-effects inside their setters.
  const [msgCount, setMsgCount] = useState(1);
  const [cycleId, setCycleId] = useState(0);
  const [rupees, setRupees] = useState<Array<{ id: number; x: number; drift: number }>>([]);
  const rupeeIdRef = useRef(0); // only mutated in effects / event handlers, never inside setters

  // Derive the visible message list from (msgCount, cycleId) — no state needed for this
  const visibleMessages = Array.from({ length: msgCount }, (_, i) => ({
    msgIndex: i,
    // cycleId * 10 + i gives a unique, stable key per cycle that never repeats
    uid: cycleId * 10 + i,
  }));

  // Tick messages forward — state setter is pure (no side effects inside)
  useEffect(() => {
    const t = setInterval(() => {
      setMsgCount((c) => {
        if (c < incomingMessages.length) return c + 1;
        // Trigger reset via separate state; do NOT call setCycleId here —
        // we'll do it in a follow-up effect to keep the setter pure.
        return 0; // sentinel: means "reset happened"
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);

  // When msgCount hits 0 (sentinel), bump cycleId and restart at 1
  useEffect(() => {
    if (msgCount === 0) {
      setCycleId((c) => c + 1);
      setMsgCount(1);
    }
  }, [msgCount]);

  // Spawn a rupee particle whenever a new message appears (msgCount grows > 1)
  useEffect(() => {
    if (msgCount <= 1) return; // skip initial render
    rupeeIdRef.current += 1;
    const id = rupeeIdRef.current;
    setRupees((r) => [
      ...r,
      {
        id,
        x: ((id * 37) % 60) - 30,   // deterministic spread, no Math.random() in render
        drift: id % 2 === 0 ? 14 : -14,
      },
    ]);
  }, [msgCount]);

  // Also spawn on each cycle reset so the animation keeps going
  useEffect(() => {
    if (cycleId === 0) return;
    rupeeIdRef.current += 1;
    const id = rupeeIdRef.current;
    setRupees((r) => [
      ...r.slice(-6), // keep at most 6 old particles to avoid memory buildup
      { id, x: ((id * 37) % 60) - 30, drift: id % 2 === 0 ? 14 : -14 },
    ]);
  }, [cycleId]);

  // Step ticker
  useEffect(() => {
    const t = setInterval(() => setActiveStep((s) => (s + 1) % captureSteps.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full max-w-[640px] mx-auto">
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-3xl blur-3xl bg-gradient-to-br from-[#25D366]/15 via-transparent to-[#00e5ff]/10 pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── WhatsApp chat panel ── */}
        <div className="glass rounded-2xl overflow-hidden animate-float shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#075E54]/60 border-b border-white/[0.07]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-xs font-bold text-white">
              🍛
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Kavita's Kitchen</p>
              <p className="text-[10px] text-[#25D366]">● Online</p>
            </div>
            <div className="ml-auto flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-blink" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-blink" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>

          {/* Messages */}
          <div className="relative p-3 space-y-2 min-h-[220px] overflow-hidden">
            <AnimatePresence>
              {visibleMessages.map(({ msgIndex, uid }) => {
                const msg = incomingMessages[msgIndex];
                return (
                  <motion.div
                    key={uid}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex gap-2 items-start"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex-shrink-0 mt-0.5 text-[8px] flex items-center justify-center text-white font-bold">
                      {msg.name[0]}
                    </div>
                    <div className="msg-in px-3 py-2 max-w-[160px]">
                      <p className="text-[9px] font-semibold text-[#25D366] mb-0.5">{msg.name}</p>
                      <p className="text-[10px] text-slate-200 leading-snug">{msg.text}</p>
                      <p className="text-[8px] text-slate-500 text-right mt-1">{msg.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Rupee particles leaking out */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {rupees.map((r) => (
                <RupeeParticle key={r.id} x={r.x} delay={0} drift={r.drift} />
              ))}
            </div>

            {/* "No reply" indicator */}
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5 mt-2 px-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping-slow" />
              <span className="text-[9px] text-red-400 font-medium">Owner not responding…</span>
            </motion.div>
          </div>

          {/* Lost counter */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-red-500/10 flex items-center justify-between">
            <span className="text-[9px] text-red-400 font-medium">Revenue leaking</span>
            <span className="text-[10px] font-bold text-red-400">
              ₹{(visibleMessages.length * 420).toLocaleString("en-IN")} at risk
            </span>
          </div>
        </div>

        {/* ── AI Capture panel ── */}
        <div className="glass-cyan rounded-2xl overflow-hidden animate-float-2 shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#00e5ff]/10">
            <div className="w-6 h-6 rounded-md bg-[#00e5ff]/20 flex items-center justify-center text-xs">⚡</div>
            <p className="text-xs font-semibold text-[#00e5ff]">Order OS · AI Engine</p>
            <div className="ml-auto status-dot" />
          </div>

          <div className="p-3 space-y-2.5 min-h-[220px]">
            {captureSteps.map((step, i) => (
              <motion.div
                key={step.label}
                animate={{
                  opacity: i <= activeStep ? 1 : 0.25,
                  scale: i === activeStep ? 1.02 : 1,
                }}
                transition={{ duration: 0.4 }}
                className={`relative px-3 py-2.5 rounded-xl border transition-all ${
                  i === activeStep
                    ? "border-[#00e5ff]/30 bg-[#00e5ff]/8"
                    : i < activeStep
                    ? "border-[#25D366]/20 bg-[#25D366]/5"
                    : "border-white/[0.05] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{step.icon}</span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">{step.label}</p>
                    <p className="text-[9px] text-slate-400">{step.sub}</p>
                  </div>
                  {i < activeStep && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                      <span className="text-[8px] text-[#25D366]">✓</span>
                    </div>
                  )}
                  {i === activeStep && (
                    <div className="ml-auto flex gap-0.5">
                      {[...Array(3)].map((_, j) => (
                        <motion.div
                          key={j}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.2 }}
                          className="w-1 h-1 rounded-full bg-[#00e5ff]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Order summary card */}
            <AnimatePresence>
              {activeStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-3 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25"
                >
                  <p className="text-[9px] font-bold text-[#25D366] mb-1">✓ Order Captured</p>
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-slate-300">📦 2× Paneer Butter Masala</p>
                    <p className="text-[8px] text-slate-300">📍 Sector 14, Gurgaon</p>
                    <p className="text-[8px] text-slate-300">💰 ₹480 confirmed</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-4 py-2 border-t border-[#00e5ff]/10 bg-[#25D366]/5">
            <span className="text-[9px] text-[#25D366] font-medium">Revenue recovered · 24s avg response</span>
          </div>
        </div>
      </div>

      {/* Bottom stat bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="mt-4 glass rounded-xl px-4 py-3 flex items-center justify-between"
      >
        {[
          { label: "Orders captured today", val: "23", color: "#25D366" },
          { label: "Avg response", val: "<30s", color: "#00e5ff" },
          { label: "Revenue recovered", val: "₹9,660", color: "#3b82f6" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-sm font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[9px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background layers */}
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#25D366]/6 blur-[120px] animate-orb" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#00e5ff]/5 blur-[100px] animate-orb" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] rounded-full bg-[#7c3aed]/4 blur-[100px] animate-orb" style={{ animationDelay: "4s" }} />
      </div>

      {/* Scan line */}
      <motion.div
        animate={{ y: ["-100%", "100vh"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/20 to-transparent pointer-events-none z-10"
      />

      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left: copy ── */}
          <motion.div style={{ y: y1, opacity }} className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 glass-green px-4 py-1.5 rounded-full mb-6"
            >
              <div className="status-dot" />
              <span className="text-xs text-[#25D366] font-medium tracking-wide">AI-Powered Revenue Recovery</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-[68px] font-extrabold leading-[1.05] tracking-tight mb-6"
              style={{ fontFamily: "var(--font-space)" }}
            >
              Every Delayed
              <br />
              Reply Is{" "}
              <span className="gradient-text-danger">Lost Revenue</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg text-slate-400 leading-relaxed max-w-xl mb-10"
            >
              WhatsApp Order OS detects missed orders during rush hours, captures
              customer intent with AI, and auto-confirms orders —{" "}
              <span className="text-slate-200 font-medium">so you recover revenue while you cook.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <a
                href="#cta"
                className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white text-base"
              >
                <span>Start Free Analysis</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="btn-ghost inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-slate-300 text-base"
              >
                <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                See How It Works
              </a>
            </motion.div>

            {/* Social proof strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10 flex items-center gap-4 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {["🧑‍🍳","👩‍🍳","🧑‍🍳","👩‍🍳"].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 border-2 border-[#030711] flex items-center justify-center text-sm">{e}</div>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-300 font-medium">Trusted by food businesses</p>
                <div className="flex gap-0.5 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Right: 3D visual ── */}
          <motion.div
            style={{ y: y2 }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="perspective-1000"
          >
            <FloatingWhatsAppPanel />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <p className="text-[10px] text-slate-600 tracking-widest uppercase">Scroll</p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-8 bg-gradient-to-b from-[#25D366]/60 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
