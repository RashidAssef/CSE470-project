import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading component displaying either a centered modern spinner or a pulse card skeleton list.
 * @param {string} variant - "spinner" | "skeleton" | "inline"
 * @param {number} count - number of skeletons to show when variant is "skeleton"
 */
export default function Loading({ variant = 'spinner', count = 3 }) {
  if (variant === 'skeleton') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm h-96 flex flex-col justify-between p-6">
            <div className="space-y-4 w-full">
              {/* Thumbnail Skeleton */}
              <div className="h-44 bg-slate-200 rounded-xl w-full"></div>
              {/* Category & Badge */}
              <div className="flex gap-2">
                <div className="h-4 bg-slate-200 rounded w-16"></div>
                <div className="h-4 bg-slate-200 rounded w-12"></div>
              </div>
              {/* Title Skeleton */}
              <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              {/* Description Skeleton */}
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
            {/* Price & Action Skeleton */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
              <div className="h-6 bg-slate-200 rounded w-16"></div>
              <div className="h-10 bg-slate-200 rounded w-28"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center space-x-2 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500">Loading details...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin"></div>
        <Loader2 className="absolute h-6 w-6 animate-pulse text-blue-600" />
      </div>
      <p className="text-slate-500 font-medium animate-pulse text-sm">Loading resources, please wait...</p>
    </div>
  );
}
