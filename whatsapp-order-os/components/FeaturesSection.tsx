"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: "📡",
    title: "Revenue Leak Detection",
    description: "Baseline analysis of your WhatsApp response patterns. See exact drop-off points, slow replies, and estimated loss.",
    badge: "Phase 1 · Free",
    color: "#ef4444",
    details: ["Response time heatmap", "Peak hour analysis", "14-day leak report", "₹ at-risk estimate"],
  },
  {
    icon: "🎯",
    title: "AI Intent Classification",
    description: "Every message classified as ORDER, INQUIRY, or COMPLAINT. Hinglish, broken English, emoji orders — all handled.",
    badge: "Core AI",
    color: "#00e5ff",
    details: ["ORDER / INQUIRY / COMPLAINT", "Hinglish support", "90%+ accuracy", "Edge case escalation"],
  },
  {
    icon: "⚡",
    title: "Smart Order Extraction",
    description: "Item, quantity, address, delivery time — all extracted with field-level confidence. Ambiguous fields caught before confirming.",
    badge: "Field-level AI",
    color: "#3b82f6",
    details: ["Item + quantity parsing", "Address recognition", "Confidence scoring", "Hindi number words"],
  },
  {
    icon: "✅",
    title: "Auto-Confirmations",
    description: "When confidence is high, orders are confirmed and customer notified in <30 seconds. No owner action needed.",
    badge: "<30s response",
    color: "#25D366",
    details: ["Auto-reply to customer", "Multi-threshold check", "WhatsApp confirmation", "Order receipt sent"],
  },
  {
    icon: "👨‍💼",
    title: "Human-in-the-Loop",
    description: "Low-confidence orders? Owner gets a tap-to-approve message on WhatsApp. One tap confirms. Every correction trains the AI.",
    badge: "HITL system",
    color: "#f97316",
    details: ["Interactive buttons", "Approve / Edit / Reject", "Correction logging", "AI trains from edits"],
  },
  {
    icon: "🧠",
    title: "Customer Memory",
    description: "Customer profiles auto-created. Address saved after first confirmed order. Repeat buyers handled with zero re-entry.",
    badge: "Memory engine",
    color: "#7c3aed",
    details: ["Auto profile creation", "Address memory", "Order history", "'Usual order' support"],
  },
  {
    icon: "🔄",
    title: "Repeat Order Recognition",
    description: "'Usual order bhej do' resolved from memory. Recurring customers need no re-extraction — it just works.",
    badge: "80%+ accuracy",
    color: "#25D366",
    details: ["Pattern recognition", "Memory injection", "Zero re-entry", "Improves over time"],
  },
  {
    icon: "🚨",
    title: "Complaint Firewall",
    description: "Complaints never get AI responses. Instantly routed to owner with zero automation. Protecting your customer relationships.",
    badge: "Zero AI risk",
    color: "#ef4444",
    details: ["Instant owner alert", "No AI response", "Complaint logging", "Relationship protected"],
  },
];

function FeatureCard({ feat, index, inView }: {
  feat: typeof features[0];
  index: number;
  inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.07, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="feature-card glass rounded-2xl p-6 relative overflow-hidden group"
      style={{ borderColor: hovered ? `${feat.color}30` : undefined }}
    >
      {/* Background hover glow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 20%, ${feat.color}10, transparent 65%)` }}
      />

      {/* Top strip on hover */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 h-px origin-left"
        style={{ background: `linear-gradient(to right, ${feat.color}, transparent)` }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300"
            style={{
              background: hovered ? `${feat.color}20` : "rgba(255,255,255,0.05)",
              border: `1px solid ${hovered ? feat.color + "35" : "rgba(255,255,255,0.08)"}`,
              boxShadow: hovered ? `0 0 20px ${feat.color}30` : "none",
            }}
          >
            {feat.icon}
          </div>
          <span
            className="text-[9px] px-2.5 py-1 rounded-full font-semibold tracking-wide"
            style={{ background: `${feat.color}15`, color: feat.color }}
          >
            {feat.badge}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white mb-2" style={{ fontFamily: "var(--font-space)" }}>
          {feat.title}
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{feat.description}</p>

        {/* Detail pills */}
        <div className="flex flex-wrap gap-1.5">
          {feat.details.map((d) => (
            <span
              key={d}
              className="text-[9px] px-2 py-0.5 rounded-full border font-medium transition-all duration-300"
              style={{
                borderColor: hovered ? `${feat.color}25` : "rgba(255,255,255,0.07)",
                color: hovered ? feat.color : "#64748b",
                background: hovered ? `${feat.color}08` : "transparent",
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-grid-bg opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-[#25D366]/20 to-transparent" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-[#7c3aed]/6 blur-[120px] animate-orb" />
      <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-[#25D366]/5 blur-[100px] animate-orb" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-4"
        >
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#25D366] glass-green rounded-full tracking-wider uppercase">
            Platform Features
          </span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-space)" }}
        >
          Not a chatbot.{" "}
          <span className="gradient-text">An operating system.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-center text-lg max-w-2xl mx-auto mb-14"
        >
          Every layer of WhatsApp Order OS is engineered for one outcome:
          turning missed messages into confirmed revenue, automatically.
        </motion.p>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feat, i) => (
            <FeatureCard key={feat.title} feat={feat} index={i} inView={inView} />
          ))}
        </div>

        {/* Bottom comparison strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
          className="mt-12 glass rounded-2xl p-6"
        >
          <p className="text-xs font-semibold text-center text-slate-400 mb-6 tracking-wider uppercase">
            WhatsApp Order OS vs. Doing It Manually
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Response time", manual: "> 10 min", os: "< 30 sec" },
              { label: "Missed orders", manual: "3–5 / day", os: "≈ 0" },
              { label: "Order accuracy", manual: "~70%", os: "> 85%" },
              { label: "Owner effort", manual: "100%", os: "< 10%" },
            ].map((row) => (
              <div key={row.label} className="text-center">
                <p className="text-[10px] text-slate-500 mb-2">{row.label}</p>
                <div className="space-y-1">
                  <div className="glass-red rounded-lg px-3 py-1.5">
                    <p className="text-xs font-semibold text-red-400">{row.manual}</p>
                    <p className="text-[8px] text-slate-500">Manual</p>
                  </div>
                  <div className="glass-green rounded-lg px-3 py-1.5">
                    <p className="text-xs font-semibold text-[#25D366]">{row.os}</p>
                    <p className="text-[8px] text-slate-500">Order OS</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
