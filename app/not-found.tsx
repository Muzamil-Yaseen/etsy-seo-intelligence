import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
        <Search className="w-6 h-6" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-white mb-2">404</h1>
      <h2 className="text-lg font-semibold text-slate-200 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        The requested page does not exist. Use the Etsy SEO Intelligence Studio to research keywords and optimize listings.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Go to SEO Intelligence Studio
      </Link>
    </div>
  );
}
