import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
      
      {/* Visual illustration / badge */}
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <HelpCircle className="h-12 w-12" />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white rounded-full px-2 py-0.5 text-[10px] font-extrabold shadow-sm border-2 border-white">
          404 ERROR
        </div>
      </div>

      <h1 className="font-heading text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
        Page Not Found
      </h1>
      
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        We look high and low, but the route you are seeking could not be resolved. It may have been relocated, or the link is outdated.
      </p>

      {/* Button link */}
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-100 hover:shadow-lg focus:outline-none"
      >
        <ArrowLeft className="h-4.5 w-4.5" />
        Return to Catalog
      </Link>
    </div>
  );
}
