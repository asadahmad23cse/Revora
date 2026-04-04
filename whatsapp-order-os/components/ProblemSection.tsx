"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

const messages = [
  { from: "Ramesh", text: "2 thali please, aaj jaldi chahiye", time: "11:02", unread: true },
  { from: "Divya", text: "Usual order bhej do bhai 🙏", time: "11:04", unread: true },
  { from: "Manoj", text: "Kya lunch ready hai? Kitne baje milega?", time: "11:06", unread: true },
  { from: "Sunita", text: "1 kg kadhai paneer + 4 roti please", time: "11:08", unread: true },
  { from: "Priya", text: "Bhai order confirm karo!", time: "11:11", unread: true },
  { from: "Vikram", text: "Order karna tha...no reply so ordering elsewhere", time: "11:19", unread: false, dropped: true },
];

const painPoints = [
  {
    icon: "📱",
    headline: "Rush hour chaos",
    copy: "50–80 messages flood in between 11 AM–12 PM while you're cooking. You can't type and cook at the same time.",
    stat: "50–80 msgs",
    statLabel: "peak hour",
    color: "#ef4444",
  },
  {
    icon: "⏱️",
    headline: "5 minutes is all it takes",
    copy: "Customers give up within 5 minutes of no reply. They don't call again — they just order from someone else.",
    stat: "< 5 min",
    statLabel: "before they leave",
    color: "#f97316",
  },
  {
    icon: "💸",
    headline: "Invisible daily loss",
    copy: "₹300–1,500 per missed order. 3–5 missed orders per day. You don't even know it's happening.",
    stat: "₹1,500",
    statLabel: "per missed order",
    color: "#eab308",
  },
  {
    icon: "🧠",
    headline: "Mental exhaustion",
    copy: "By evening, owner is mentally drained from tracking orders manually. Errors increase. Disputes follow.",
    stat: "100%",
    statLabel: "manual today",
    color: "#8b5cf6",
  },
];

function MessageFeed() {
  const [visible, setVisible] = useState(1);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      setVisible((v) => (v < messages.length ? v + 1 : v));
    }, 700);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} className="glass rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075E54]/40 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#25D366]/30 flex items-center justify-center text-sm">🍛</div>
          <span className="text-xs font-semibold text-white">Kavita&apos;s Kitchen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-blink" />
          <span className="text-[9px] text-red-400">Owner offline</span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-3 space-y-1.5 min-h-[300px] relative">
        {messages.slice(0, visible).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`flex items-start gap-2 ${msg.dropped ? "opacity-60" : ""}`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex-shrink-0 text-[9px] font-bold text-white flex items-center justify-center mt-0.5">
              {msg.from[0]}
            </div>
            <div className={`msg-in px-3 py-2 flex-1 relative ${msg.dropped ? "border-red-500/30 bg-red-500/5" : ""}`}>
              <p className="text-[9px] font-semibold text-[#25D366] mb-0.5">{msg.from}</p>
              <p className={`text-[10px] leading-snug ${msg.dropped ? "text-red-400 italic" : "text-slate-200"}`}>{msg.text}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[8px] text-slate-500">{msg.time}</p>
                {msg.unread && !msg.dropped && (
                  <span className="w-3.5 h-3.5 rounded-full bg-[#25D366] text-[7px] text-white flex items-center justify-center font-bold">1</span>
                )}
                {msg.dropped && (
                  <span className="text-[8px] text-red-400 font-medium">❌ Lost</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator ghost */}
        {visible < messages.length && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="flex items-center gap-2 px-2"
          >
            <div className="w-6 h-6 rounded-full bg-slate-700/50 flex-shrink-0" />
            <div className="msg-in px-3 py-2 flex gap-1 items-center">
              {[...Array(3)].map((_, j) => (
                <motion.div
                  key={j}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.5, delay: j * 0.15, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-3 py-2 border-t border-white/[0.06] bg-red-500/8 flex items-center justify-between">
        <span className="text-[9px] text-red-400">⚠️ {visible} unanswered messages</span>
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[9px] text-red-400 font-semibold"
        >
          Revenue leaking…
        </motion.span>
      </div>
    </div>
  );
}

export default function ProblemSection() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} id="problem" className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1e]/80 to-transparent" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-red-500/5 blur-[120px] animate-orb" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <span className="inline-block px-3 py-1 text-xs font-semibold text-red-400 glass-red rounded-full tracking-wider uppercase">
            The Problem
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-space)" }}
        >
          Your busiest hour is your{" "}
          <span className="gradient-text-danger">biggest leak</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 text-center text-lg max-w-2xl mx-auto mb-16"
        >
          Between 11 AM and 12 PM, your phone explodes with orders. You&apos;re cooking.
          Every unanswered message is a customer walking away — permanently.
        </motion.p>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Live message feed */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center lg:items-start"
          >
            <div className="mb-4 px-3 py-1.5 glass rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping-slow" />
              <span className="text-[10px] text-red-400 font-medium tracking-wide">LIVE · Rush hour simulation</span>
            </div>
            <MessageFeed />

            {/* Timestamp legend */}
            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
              <span>11:02 AM</span>
              <div className="flex-1 h-px bg-gradient-to-r from-red-500/40 to-transparent" />
              <span className="text-red-400 font-medium">Peak leak window</span>
              <div className="flex-1 h-px bg-gradient-to-l from-red-500/40 to-transparent" />
              <span>11:20 AM</span>
            </div>
          </motion.div>

          {/* Pain point cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {painPoints.map((p, i) => (
              <motion.div
                key={p.headline}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                className="glass feature-card rounded-2xl p-5 group"
                style={{ borderColor: `${p.color}18` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="text-right">
                    <p className="text-sm font-extrabold" style={{ color: p.color }}>{p.stat}</p>
                    <p className="text-[9px] text-slate-500">{p.statLabel}</p>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{p.headline}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{p.copy}</p>

                {/* Bottom glow strip */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(to right, transparent, ${p.color}60, transparent)` }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Impact quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-16 glass rounded-2xl p-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5" />
          <p className="relative text-xl md:text-2xl font-bold text-slate-200 max-w-3xl mx-auto">
            &ldquo;Aap WhatsApp pe paisa lose kar rahe ho —{" "}
            <span className="gradient-text-danger">main dikhata hoon kitna, aur phir band karta hoon.</span>&rdquo;
          </p>
          <p className="relative text-xs text-slate-500 mt-3">— WhatsApp Order OS core promise</p>
        </motion.div>
      </div>
    </section>
  );
}
