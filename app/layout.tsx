import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem('etsy_theme');
                if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="h-full bg-[#F8FAFC] text-slate-900 dark:bg-[#070B14] dark:text-[#F8FAFC] antialiased font-sans transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
