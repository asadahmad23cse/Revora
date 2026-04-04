"use client";

import { motion } from "framer-motion";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.06] bg-[#030711]">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#25D366]/15 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.12-1.34A9.93 9.93 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="white" fillOpacity="0.9"/>
                  <path d="M9 8h6M9 12h4" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-white" style={{ fontFamily: "var(--font-space)" }}>
                WhatsApp<span className="text-[#25D366]"> Order OS</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-4">
              Revenue leak detection, AI order capture, and customer memory for cloud kitchens,
              tiffin services, and home food businesses.
            </p>
            <div className="flex items-center gap-1.5 glass-green px-3 py-1.5 rounded-full w-fit">
              <div className="status-dot" />
              <span className="text-[10px] text-[#25D366] font-medium">Accepting new businesses</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Product</p>
            <ul className="space-y-2.5">
              {["Revenue Leak Detector", "Order Capture", "Customer Memory", "Human-in-Loop", "Pricing"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors duration-200">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company + Contact */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Company</p>
            <ul className="space-y-2.5">
              {["About", "Blog", "Careers", "Contact", "Privacy Policy", "Terms of Service"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors duration-200">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-600">
            © {year} WhatsApp Order OS. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-600">Built for food businesses in India</span>
            <div className="flex gap-3">
              {/* WhatsApp */}
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg glass flex items-center justify-center text-[#25D366] hover:border-[#25D366]/30 transition-all duration-300 text-xs"
              >
                💬
              </a>
              {/* Twitter/X */}
              <a
                href="#"
                className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-white hover:border-white/20 transition-all duration-300 text-xs"
              >
                ✕
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                className="w-7 h-7 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-[#0077b5] hover:border-[#0077b5]/30 transition-all duration-300 text-xs"
              >
                in
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
