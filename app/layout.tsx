import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Etsy SEO Intelligence • Competitor Research & Optimization Studio",
  description: "Research Etsy competitors, uncover keyword patterns, optimize titles and 13 tags, and plan pricing margins.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#0B1120] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
