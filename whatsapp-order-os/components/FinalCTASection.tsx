"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export default function FinalCTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section id="cta" ref={ref} className="relative py-32 overflow-hidden">
      {/* Multi-layer background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1e]/40 to-transparent" />
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Dramatic glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#25D366]/8 blur-[160px]" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#00e5ff]/5 blur-[120px] animate-orb" />
      <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#7c3aed]/5 blur-[120px] animate-orb" style={{ animationDelay: "2s" }} />

      {/* Top border line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/30 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          className="inline-flex items-center gap-2 glass-green px-4 py-1.5 rounded-full mb-8"
        >
          <div className="status-dot" />
          <span className="text-xs text-[#25D366] font-medium tracking-wide">Free 14-Day Revenue Leak Analysis</span>
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
          style={{ fontFamily: "var(--font-space)" }}
        >
          Stop leaving money
          <br />
          <span className="gradient-text">on WhatsApp.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Connect your WhatsApp Business account. Get a precise revenue leak report in 14 days — completely free.
          No credit card. No commitment. Just the truth about what you&apos;re losing.
        </motion.p>

        {/* CTA form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="max-w-lg mx-auto mb-8"
        >
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 glass px-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#25D366]/40 transition-all duration-300"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary px-8 py-3.5 rounded-xl font-semibold text-white text-sm whitespace-nowrap"
              >
                Start Free Analysis →
              </motion.button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-green rounded-xl px-6 py-4 flex items-center gap-3 justify-center"
            >
              <div className="status-dot" />
              <p className="text-sm font-semibold text-[#25D366]">
                ✓ You&apos;re on the list! We&apos;ll reach out within 24 hours.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Alternative CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          <a href="#how-it-works" className="btn-ghost text-sm text-slate-300 font-medium px-5 py-2.5 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Watch a demo
          </a>
          <a
            href="https://wa.me/919999999999?text=Hi%2C%20I%20want%20to%20know%20more%20about%20WhatsApp%20Order%20OS"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm text-slate-300 font-medium px-5 py-2.5 rounded-xl flex items-center gap-2"
          >
            <span className="text-[#25D366]">💬</span>
            Chat on WhatsApp
          </a>
        </motion.div>

        {/* Social proof mini strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center items-center gap-6 text-center"
        >
          {[
            { val: "Free", label: "14-day analysis" },
            { val: "< 5 min", label: "to connect" },
            { val: "₹15k+", label: "avg recovery" },
            { val: "Zero", label: "commitment" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-base font-extrabold text-[#25D366]" style={{ fontFamily: "var(--font-space)" }}>{s.val}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Decorative floating cards */}
        <div className="relative mt-16 pointer-events-none select-none hidden md:block">
          {/* Left floating message */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-8 -top-4 glass-green rounded-xl px-4 py-3 text-left w-52"
          >
            <p className="text-[9px] text-[#25D366] font-semibold mb-1">⚡ Just now</p>
            <p className="text-[10px] text-slate-200">Order captured: ₹680</p>
            <p className="text-[9px] text-slate-400">22s · Auto-confirmed</p>
          </motion.div>
          {/* Right floating card */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute -right-8 -top-4 glass-cyan rounded-xl px-4 py-3 text-left w-52"
          >
            <p className="text-[9px] text-[#00e5ff] font-semibold mb-1">📊 This month</p>
            <p className="text-[10px] text-slate-200">Revenue recovered: ₹14,200</p>
            <p className="text-[9px] text-slate-400">47 orders · 94% auto-confirmed</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
