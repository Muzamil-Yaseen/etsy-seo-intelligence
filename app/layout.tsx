import type { Metadata } from "next";
import { Manrope, Poppins } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

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
    <html lang="en" className={`h-full ${manrope.variable} ${poppins.variable}`}>
      <body className="h-full bg-[#0B1120] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

