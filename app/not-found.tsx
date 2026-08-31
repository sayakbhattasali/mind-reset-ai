import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#05070B] text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-emerald-400 font-mono text-sm uppercase tracking-widest mb-2">404 - Not Found</div>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all"
      >
        <ArrowLeft size={16} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
