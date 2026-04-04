"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const testimonials = [
  {
    name: "Kavita Sharma",
    role: "Home tiffin service · Gurgaon",
    initials: "KS",
    color: "#25D366",
    text: "Pehle lunch rush mein 5-6 orders miss ho jaate the. Ab ek bhi nahi. Orders aathe hain, AI confirm kar deta hai, main sirf cook karti hoon. ₹12,000 extra recovered last month.",
    orders: 47,
    recovery: "₹12,400",
    time: "22s avg",
  },
  {
    name: "Ravi Nair",
    role: "Cloud kitchen · Bangalore",
    initials: "RN",
    color: "#00e5ff",
    text: "The revenue leak report was a shock — ₹22,000 in one month. I didn't believe it. But the system proved it. Now those orders get captured automatically. Game changer for us.",
    orders: 91,
    recovery: "₹21,800",
    time: "18s avg",
  },
  {
    name: "Meena Patel",
    role: "Homemade food business · Ahmedabad",
    initials: "MP",
    color: "#7c3aed",
    text: "Meri regular customers ka usual order system yaad rakhta hai. Sunita ne likha 'same order' aur confirm ho gaya. 2 seconds mein. Mujhe kuch nahi karna pada.",
    orders: 38,
    recovery: "₹9,200",
    time: "15s avg",
  },
  {
    name: "Deepak Joshi",
    role: "Catering business · Pune",
    initials: "DJ",
    color: "#f97316",
    text: "I was skeptical about AI handling my customers. But the HITL system means I stay in control. For tricky orders, I get a tap-to-approve message. It's the perfect balance.",
    orders: 63,
    recovery: "₹16,600",
    time: "25s avg",
  },
];

const metrics = [
  { value: "₹15,000+", label: "avg recovered / month", sub: "per business", color: "#25D366" },
  { value: "94%", label: "auto-confirm rate", sub: "after 30 days", color: "#00e5ff" },
  { value: "<30s", label: "average response time", sub: "vs 10+ min manual", color: "#3b82f6" },
  { value: "0", label: "missed orders during rush", sub: "AI captures all", color: "#7c3aed" },
];

export default function SocialProofSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="trust" ref={ref} className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-25" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-[#25D366]/5 blur-[120px] animate-orb" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-4">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#25D366] glass-green rounded-full tracking-wider uppercase">
            Real Results
          </span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-space)" }}
        >
          The numbers don&apos;t lie.{" "}
          <span className="gradient-text">Revenue recovered.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-center text-lg max-w-2xl mx-auto mb-14"
        >
          Home food sellers, cloud kitchens, tiffin services — real businesses,
          real numbers, zero hype.
        </motion.p>

        {/* Metric counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass rounded-2xl p-5 text-center group hover:border-white/15 transition-all duration-300"
              style={{ borderColor: `${m.color}15` }}
            >
              <p className="text-3xl font-extrabold mb-1" style={{ color: m.color, fontFamily: "var(--font-space)" }}>
                {m.value}
              </p>
              <p className="text-xs font-medium text-slate-300">{m.label}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
              className="glass feature-card rounded-2xl p-6 group relative overflow-hidden"
              style={{ borderColor: `${t.color}18` }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{ background: `radial-gradient(circle at 0% 0%, ${t.color}08, transparent 60%)` }}
              />

              {/* Quote mark */}
              <div className="absolute top-4 right-5 text-5xl font-serif leading-none opacity-10" style={{ color: t.color }}>
                &ldquo;
              </div>

              <div className="relative z-10">
                {/* Profile */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${t.color}50, ${t.color}25)` }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.role}</p>
                  </div>
                  {/* Stars */}
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <p className="text-sm text-slate-300 leading-relaxed mb-5 italic">&ldquo;{t.text}&rdquo;</p>

                {/* Stats */}
                <div className="flex gap-3 pt-4 border-t border-white/[0.07]">
                  {[
                    { label: "Orders", val: t.orders },
                    { label: "Recovered", val: t.recovery },
                    { label: "Response", val: t.time },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 text-center py-1.5 rounded-lg bg-white/[0.03]">
                      <p className="text-xs font-bold" style={{ color: t.color }}>{s.val}</p>
                      <p className="text-[8px] text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {[
            { icon: "🔒", label: "WhatsApp Business API" },
            { icon: "🛡️", label: "Data never shared" },
            { icon: "⚡", label: "14-day free trial" },
            { icon: "🤝", label: "Cancel anytime" },
          ].map((b) => (
            <div key={b.label} className="glass px-4 py-2.5 rounded-xl flex items-center gap-2">
              <span className="text-sm">{b.icon}</span>
              <span className="text-xs text-slate-400 font-medium">{b.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
