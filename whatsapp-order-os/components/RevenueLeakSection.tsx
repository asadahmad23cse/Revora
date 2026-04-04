"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, animate } from "framer-motion";

function useCountUp(target: number, duration = 2, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return controls.stop;
  }, [target, duration, start]);
  return val;
}

const leakMetrics = [
  { label: "Messages this week", value: 312, suffix: "", color: "#3b82f6", icon: "💬" },
  { label: "Unanswered >5 min", value: 47, suffix: "", color: "#f97316", icon: "⏱️" },
  { label: "Estimated drop-offs", value: 18, suffix: "", color: "#ef4444", icon: "👥" },
  { label: "Revenue at risk", value: 18400, suffix: "₹", color: "#ef4444", icon: "💸", prefix: true },
];

const weekData = [28, 42, 35, 58, 47, 63, 39]; // missed messages per day
const maxBar = Math.max(...weekData);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function RevenueLeakSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (inView) setTimeout(() => setStarted(true), 300);
  }, [inView]);

  const msgs   = useCountUp(312, 1.6, started);
  const unanswered = useCountUp(47, 1.8, started);
  const dropoffs = useCountUp(18, 2, started);
  const revenue = useCountUp(18400, 2.2, started);

  const counts = [msgs, unanswered, dropoffs, revenue];

  return (
    <section id="revenue-leak" ref={ref} className="relative py-28 overflow-hidden">
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/50 via-transparent to-[#0a0f1e]/50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-red-600/6 blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-4"
        >
          <span className="inline-block px-3 py-1 text-xs font-semibold text-orange-400 glass-red rounded-full tracking-wider uppercase">
            Revenue Leak Detector
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-space)" }}
        >
          See exactly{" "}
          <span className="gradient-text">how much you&apos;re losing</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-slate-400 text-center text-lg max-w-2xl mx-auto mb-16"
        >
          Phase 1 is completely free. Connect your WhatsApp, and within 14 days
          you&apos;ll see a precise revenue leak report — no guesswork.
        </motion.p>

        {/* Main dashboard panel */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl glow-red"
        >
          {/* Ambient gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/6 via-transparent to-orange-500/4 pointer-events-none rounded-3xl" />

          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-space)" }}>
                Revenue Leak Report
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 14 days · Kavita&apos;s Kitchen</p>
            </div>
            <div className="flex items-center gap-2 glass-red px-4 py-2 rounded-xl">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-400"
              />
              <span className="text-xs font-semibold text-red-400">Live Analysis</span>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {leakMetrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                className="glass rounded-2xl p-4 relative group overflow-hidden"
                style={{ borderColor: `${m.color}20` }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${m.color}12, transparent 70%)` }} />
                <p className="text-xl mb-2">{m.icon}</p>
                <p
                  className="text-2xl font-extrabold stat-counter leading-none"
                  style={{ color: m.color, fontFamily: "var(--font-space)" }}
                >
                  {m.prefix ? "₹" : ""}{counts[i].toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">{m.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar chart — missed messages/day */}
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-300 mb-4">Missed messages · by day</p>
              <div className="flex items-end gap-2 h-24">
                {weekData.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={inView ? { height: `${(v / maxBar) * 88}px` } : { height: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.08, ease: "easeOut" }}
                      className="w-full rounded-t-md relative overflow-hidden"
                      style={{ background: `linear-gradient(to top, #ef444440, #ef4444)` }}
                    >
                      <motion.div
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        className="absolute inset-0 bg-white/10"
                      />
                    </motion.div>
                    <span className="text-[8px] text-slate-500">{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue at risk breakdown */}
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-300 mb-4">Revenue at risk · breakdown</p>
              <div className="space-y-3">
                {[
                  { label: "Unanswered order intents", pct: 58, color: "#ef4444", val: "₹10,672" },
                  { label: "Slow reply (>10 min)", pct: 27, color: "#f97316", val: "₹4,968" },
                  { label: "Incomplete orders", pct: 15, color: "#eab308", val: "₹2,760" },
                ].map((row, i) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="font-semibold" style={{ color: row.color }}>{row.val}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${row.pct}%` } : { width: 0 }}
                        transition={{ duration: 0.9, delay: 0.7 + i * 0.15, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-5 pt-4 border-t border-white/[0.07] flex justify-between items-center">
                <span className="text-xs text-slate-400">Total estimated loss</span>
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-lg font-extrabold text-red-400"
                  style={{ fontFamily: "var(--font-space)" }}
                >
                  ₹18,400
                </motion.span>
              </div>
            </div>
          </div>

          {/* CTA strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.07]"
          >
            <div>
              <p className="text-sm font-semibold text-white">Want to see YOUR revenue leak?</p>
              <p className="text-xs text-slate-400">Free 14-day analysis. No credit card required.</p>
            </div>
            <a href="#cta" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white whitespace-nowrap">
              Run My Free Analysis →
            </a>
          </motion.div>
        </motion.div>

        {/* Floating stat callouts */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { stat: "₹300–₹1,500", label: "per missed order", note: "industry average" },
            { stat: "3–5×", label: "daily missed orders", note: "during peak hours" },
            { stat: "60%", label: "customers don't return", note: "after one bad experience" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.9 + i * 0.15 }}
              className="glass rounded-2xl p-5 text-center group hover:border-red-500/30 transition-all duration-300"
            >
              <p className="text-2xl font-extrabold text-red-400 mb-1" style={{ fontFamily: "var(--font-space)" }}>{s.stat}</p>
              <p className="text-sm font-medium text-slate-200">{s.label}</p>
              <p className="text-[10px] text-slate-500 mt-1">{s.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
