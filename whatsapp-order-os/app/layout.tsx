import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WhatsApp Order OS — Stop Losing Revenue on WhatsApp",
  description:
    "WhatsApp Order OS detects missed orders, captures intent with AI, and auto-confirms orders so cloud kitchens and home food businesses never lose revenue to a delayed reply.",
  keywords: ["whatsapp orders", "cloud kitchen", "tiffin service", "order management", "revenue recovery", "AI orders"],
  openGraph: {
    title: "WhatsApp Order OS — Stop Losing Revenue on WhatsApp",
    description: "Every delayed reply is lost revenue. WhatsApp Order OS recovers it automatically.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full bg-[#030711] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
