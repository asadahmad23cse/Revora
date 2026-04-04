"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Message Arrives",
    description: "Customer sends an order via WhatsApp. The system detects it instantly — no polling, no delays.",
    detail: "Webhook fires within milliseconds. Raw message stored. Queue job dispatched.",
    icon: "💬",
    color: "#25D366",
    glowColor: "rgba(37,211,102,0.25)",
    tag: "Real-time capture",
    code: `{
  "from": "Rahul M.",
  "text": "2 paneer thali please",
  "time": "11:07:43"
}`,
  },
  {
    num: "02",
    title: "AI Classifies Intent",
    description: "LLM classifies the message: ORDER, INQUIRY, or COMPLAINT. Not just keyword matching — true intent understanding.",
    detail: "Hinglish, English, partial sentences all handled. 90%+ accuracy on production data.",
    icon: "🧠",
    color: "#00e5ff",
    glowColor: "rgba(0,229,255,0.25)",
    tag: "Intent detection",
    code: `{
  "intent": "ORDER",
  "confidence": 0.97,
  "language": "hinglish"
}`,
  },
  {
    num: "03",
    title: "Fields Extracted",
    description: "Item, quantity, address, and special instructions extracted with field-level confidence scores.",
    detail: "'Usual order' resolved from customer memory. Ambiguous fields flagged.",
    icon: "⚡",
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.25)",
    tag: "Entity extraction",
    code: `{
  "item": "Paneer Thali ×2",
  "address": "Sector 14 [memory]",
  "confidence": { "item": 0.96 }
}`,
  },
  {
    num: "04",
    title: "Auto-Confirm or Escalate",
    description: "High-confidence orders are auto-confirmed and customer notified in <30 seconds. Low-confidence? Owner gets a tap-to-approve message.",
    detail: "Thresholds: item 90%, quantity 85%, address 80%. All three must pass.",
    icon: "✅",
    color: "#25D366",
    glowColor: "rgba(37,211,102,0.25)",
    tag: "Smart routing",
    code: `{
  "action": "AUTO_CONFIRM",
  "customer_notified": true,
  "response_time": "22s"
}`,
  },
  {
    num: "05",
    title: "Memory Updated",
    description: "Order logged. Customer profile updated. Next time they say 'usual order' — the system already knows.",
    detail: "Address, preferences, order history stored. Repeat accuracy improves over time.",
    icon: "🔮",
    color: "#7c3aed",
    glowColor: "rgba(124,58,237,0.25)",
    tag: "Customer memory",
    code: `{
  "customer_id": "rahul_m",
  "usual_order": "2× Paneer Thali",
  "saved_address": "Sector 14"
}`,
  },
];

function StepCard({ step, index, isActive, onClick }: {
  step: typeof steps[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className={`relative glass rounded-2xl p-5 cursor-pointer transition-all duration-400 group
        ${isActive ? "border-opacity-40 shadow-lg" : "hover:border-white/15"}`}
      style={{
        borderColor: isActive ? `${step.color}35` : undefined,
        boxShadow: isActive ? `0 0 30px ${step.glowColor}, 0 4px 20px rgba(0,0,0,0.3)` : undefined,
      }}
    >
      {isActive && (
        <motion.div
          layoutId="step-highlight"
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: `radial-gradient(circle at 20% 50%, ${step.color}08, transparent 70%)` }}
        />
      )}
      <div className="flex items-center gap-4 relative z-10">
        {/* Number + icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl relative"
          style={{
            background: isActive ? `${step.color}18` : "rgba(255,255,255,0.04)",
            border: `1px solid ${isActive ? step.color + "35" : "rgba(255,255,255,0.07)"}`,
          }}>
          {isActive ? step.icon : <span className="text-sm font-bold text-slate-500">{step.num}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-white">{step.title}</h3>
            {isActive && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: `${step.color}20`, color: step.color }}>
                {step.tag}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{step.description}</p>
        </div>
        {/* Active indicator */}
        <div className="flex-shrink-0 w-1.5 h-8 rounded-full"
          style={{ background: isActive ? step.color : "rgba(255,255,255,0.08)" }} />
      </div>
    </motion.div>
  );
}

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Auto-advance steps
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setActiveStep((s) => (s + 1) % steps.length), 3000);
    return () => clearInterval(t);
  }, [inView]);

  const active = steps[activeStep];

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full blur-[130px] animate-orb"
        style={{ background: `${active.glowColor}` }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-4"
        >
          <span className="inline-block px-3 py-1 text-xs font-semibold text-[#00e5ff] glass-cyan rounded-full tracking-wider uppercase">
            How It Works
          </span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-space)" }}
        >
          From message to{" "}
          <span className="gradient-text">confirmed order</span>
          <br />in under 30 seconds
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-center text-lg max-w-2xl mx-auto mb-14"
        >
          A precise 5-step pipeline turns every WhatsApp message into a structured,
          confirmed order — with zero manual effort from you.
        </motion.p>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Step list */}
          <div className="space-y-3">
            {steps.map((step, i) => (
              <StepCard
                key={step.num}
                step={step}
                index={i}
                isActive={i === activeStep}
                onClick={() => setActiveStep(i)}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:sticky lg:top-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="glass rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  borderColor: `${active.color}25`,
                  boxShadow: `0 0 60px ${active.glowColor}`,
                }}
              >
                {/* Top color strip */}
                <div className="h-1" style={{ background: `linear-gradient(to right, ${active.color}, transparent)` }} />

                <div className="p-7">
                  {/* Step meta */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: `${active.color}18`, border: `1px solid ${active.color}30` }}>
                      {active.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: active.color }}>
                        Step {active.num}
                      </p>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-space)" }}>
                        {active.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{active.description}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">{active.detail}</p>

                  {/* Code snippet */}
                  <div className="rounded-xl overflow-hidden bg-[#0a0f1e] border border-white/[0.07]">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06]">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                      <span className="ml-2 text-[10px] text-slate-500 font-mono">order_os_payload.json</span>
                    </div>
                    <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto"
                      style={{ color: active.color }}>
                      {active.code}
                    </pre>
                  </div>

                  {/* Progress dots */}
                  <div className="flex items-center gap-2 mt-6">
                    {steps.map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: i === activeStep ? 1 : 0.7, opacity: i === activeStep ? 1 : 0.35 }}
                        onClick={() => setActiveStep(i)}
                        className="h-1.5 rounded-full cursor-pointer transition-all duration-300"
                        style={{
                          width: i === activeStep ? 24 : 6,
                          background: i === activeStep ? active.color : "rgba(255,255,255,0.2)",
                        }}
                      />
                    ))}
                    <span className="ml-auto text-[10px] text-slate-500">{activeStep + 1} / {steps.length}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
