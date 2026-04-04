"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

const customers = [
  {
    name: "Rahul Mehra",
    initials: "RM",
    orders: 47,
    since: "3 months",
    usualOrder: "2× Paneer Thali",
    address: "Sector 14, Gurgaon",
    lastOrder: "Yesterday",
    accuracy: 98,
    color: "#25D366",
    tags: ["Weekly", "Repeat", "Auto-confirm"],
    messages: [
      { text: "Usual order bhej do bhai", time: "11:03" },
      { text: "Order Captured: 2× Paneer Thali → Sector 14", time: "11:03", isAI: true },
    ],
  },
  {
    name: "Sunita Rao",
    initials: "SR",
    orders: 31,
    since: "2 months",
    usualOrder: "3 Tiffin boxes",
    address: "Adarsh Nagar, Block C",
    lastOrder: "2 days ago",
    accuracy: 96,
    color: "#00e5ff",
    tags: ["Tiffin plan", "Monthly"],
    messages: [
      { text: "Aaj bhi same order hai na?", time: "10:55" },
      { text: "Confirmed! 3× Tiffin → Adarsh Nagar", time: "10:55", isAI: true },
    ],
  },
  {
    name: "Priya Desai",
    initials: "PD",
    orders: 22,
    since: "6 weeks",
    usualOrder: "1 kg Daal Makhani",
    address: "MG Road, near metro",
    lastOrder: "3 days ago",
    accuracy: 94,
    color: "#7c3aed",
    tags: ["Bulk order", "Weekend"],
    messages: [
      { text: "Same as last week please 🙏", time: "10:30" },
      { text: "Order ready: 1kg Daal Makhani → MG Road", time: "10:30", isAI: true },
    ],
  },
];

const memoryNodes = [
  { label: "Usual Order", icon: "🍛", color: "#25D366" },
  { label: "Saved Address", icon: "📍", color: "#3b82f6" },
  { label: "Order History", icon: "📋", color: "#7c3aed" },
  { label: "Preferences", icon: "⚙️", color: "#f97316" },
  { label: "Timing Patterns", icon: "⏰", color: "#00e5ff" },
];

export default function CustomerMemorySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeCustomer, setActiveCustomer] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!inView) return;
    const t1 = setInterval(() => {
      setActiveCustomer((c) => (c + 1) % customers.length);
      setShowMessage(false);
      setTimeout(() => setShowMessage(true), 600);
    }, 3500);
    setTimeout(() => setShowMessage(true), 800);
    return () => clearInterval(t1);
  }, [inView]);

  const c = customers[activeCustomer];

  return (
    <section id="memory" ref={ref} className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1e]/60 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7c3aed]/7 blur-[130px] animate-orb" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-4"
        >
          <span className="inline-block px-3 py-1 text-xs font-semibold text-purple-400 glass rounded-full tracking-wider uppercase border-purple-500/20">
            Customer Intelligence
          </span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-space)" }}
        >
          It gets{" "}
          <span className="gradient-text">smarter</span> with every order
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-center text-lg max-w-2xl mx-auto mb-14"
        >
          Customer Memory turns your repeat buyers into zero-effort orders.
          Every confirmed order teaches the system. By month 2, 80%+ of
          repeat orders need zero extraction.
        </motion.p>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer list */}
          <div className="space-y-3">
            {customers.map((cust, i) => (
              <motion.div
                key={cust.name}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => { setActiveCustomer(i); setShowMessage(false); setTimeout(() => setShowMessage(true), 400); }}
                className={`glass rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
                  i === activeCustomer ? "border-opacity-40" : "hover:border-white/15"
                }`}
                style={{ borderColor: i === activeCustomer ? `${cust.color}35` : undefined }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${cust.color}50, ${cust.color}25)` }}
                  >
                    {cust.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">{cust.name}</p>
                      <span className="text-[9px] font-bold ml-2" style={{ color: cust.color }}>{cust.accuracy}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{cust.usualOrder}</p>
                    <div className="flex gap-1 mt-1.5">
                      {cust.tags.map((t) => (
                        <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-3 pt-2 border-t border-white/[0.06]">
                  <div>
                    <p className="text-[9px] text-slate-500">Total orders</p>
                    <p className="text-xs font-bold" style={{ color: cust.color }}>{cust.orders}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500">Last order</p>
                    <p className="text-xs text-slate-300">{cust.lastOrder}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Customer detail panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCustomer}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="glass rounded-3xl p-6 shadow-2xl"
              style={{ borderColor: `${c.color}25`, boxShadow: `0 0 50px ${c.color}12` }}
            >
              {/* Profile header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg, ${c.color}60, ${c.color}25)` }}
                >
                  {c.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-space)" }}>{c.name}</h3>
                  <p className="text-xs text-slate-400">Customer for {c.since}</p>
                  <div className="flex gap-1.5 mt-1">
                    <div className="status-dot" />
                    <span className="text-[9px] text-[#25D366]">Active customer</span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-extrabold" style={{ color: c.color, fontFamily: "var(--font-space)" }}>{c.accuracy}%</p>
                  <p className="text-[9px] text-slate-500">auto-accuracy</p>
                </div>
              </div>

              {/* Memory nodes */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="glass-green rounded-xl p-3">
                  <p className="text-[9px] text-slate-500 mb-1">📦 Usual Order</p>
                  <p className="text-xs font-semibold text-[#25D366]">{c.usualOrder}</p>
                </div>
                <div className="glass-cyan rounded-xl p-3">
                  <p className="text-[9px] text-slate-500 mb-1">📍 Saved Address</p>
                  <p className="text-xs font-semibold text-[#00e5ff] truncate">{c.address}</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-[9px] text-slate-500 mb-1">📋 Total Orders</p>
                  <p className="text-xs font-bold text-white">{c.orders} confirmed</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-[9px] text-slate-500 mb-1">⚡ Last Order</p>
                  <p className="text-xs font-semibold text-slate-200">{c.lastOrder}</p>
                </div>
              </div>

              {/* Live message simulation */}
              <div className="glass rounded-xl p-3">
                <p className="text-[9px] text-slate-500 mb-2 font-medium">Latest interaction</p>
                <AnimatePresence>
                  {showMessage && c.messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.isAI ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.6, duration: 0.4 }}
                      className={`flex mb-2 ${msg.isAI ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`px-3 py-2 rounded-xl text-[10px] max-w-[85%] ${
                        msg.isAI ? "msg-out text-[#3b82f6]" : "msg-in text-slate-200"
                      }`}>
                        {msg.isAI && <span className="text-[8px] block text-[#00e5ff] mb-0.5 font-semibold">⚡ Order OS AI</span>}
                        {msg.text}
                        <span className="block text-[8px] text-slate-500 text-right mt-0.5">{msg.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Memory network visual */}
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-5"
            >
              <p className="text-xs font-semibold text-slate-300 mb-4">Memory network</p>
              <div className="space-y-3">
                {memoryNodes.map((node, i) => (
                  <motion.div
                    key={node.label}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{ background: `${node.color}18`, border: `1px solid ${node.color}25` }}
                    >
                      {node.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">{node.label}</span>
                        <span className="font-semibold" style={{ color: node.color }}>Active</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${70 + i * 6}%` } : { width: 0 }}
                          transition={{ duration: 1.2, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: node.color }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Moat stat */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6 }}
              className="glass-green rounded-2xl p-5"
            >
              <p className="text-[10px] text-slate-400 mb-3">Why this is a moat:</p>
              <div className="space-y-2">
                {[
                  { month: "Month 1", pct: 62, label: "manual effort" },
                  { month: "Month 2", pct: 34, label: "manual effort" },
                  { month: "Month 3", pct: 12, label: "manual effort" },
                ].map((row, i) => (
                  <div key={row.month}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">{row.month}</span>
                      <span className="text-[#25D366] font-semibold">{row.pct}% {row.label}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${row.pct}%` } : { width: 0 }}
                        transition={{ delay: 0.7 + i * 0.2, duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-500 mt-3">Memory accumulates. Competitor can&apos;t replicate your data.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
