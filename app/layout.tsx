import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Etsy Intelligence • SEO & Competitor Intelligence Platform",
  description: "Professional Etsy SEO research, competitor intelligence, listing optimization, and market analytics platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${manrope.variable}`}>
      <body className="h-full bg-[#070B14] text-[#F8FAFC] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
