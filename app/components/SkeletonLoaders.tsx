'use client';

import React from 'react';

// Base skeleton component
const SkeletonBase: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`animate-pulse bg-neutral-200 rounded ${className}`} style={style} />
);

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card p-6 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <SkeletonBase className="h-5 w-5 rounded" />
      <SkeletonBase className="h-4 w-24" />
    </div>
    <SkeletonBase className="h-8 w-16 mb-2" />
    <SkeletonBase className="h-3 w-20" />
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="card">
    <div className="p-4 border-b border-neutral-200">
      <SkeletonBase className="h-6 w-32" />
    </div>
    <div className="divide-y divide-neutral-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, j) => (
              <SkeletonBase key={j} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Dashboard stats skeleton
export const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Form skeleton
export const FormSkeleton: React.FC = () => (
  <div className="card p-6">
    <SkeletonBase className="h-6 w-32 mb-6" />
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <SkeletonBase className="h-4 w-24 mb-2" />
          <SkeletonBase className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <SkeletonBase className="h-10 w-24" />
        <SkeletonBase className="h-10 w-24" />
      </div>
    </div>
  </div>
);

// Navigation skeleton
export const NavigationSkeleton: React.FC = () => (
  <div className="w-64 bg-white border-r border-neutral-200 h-screen p-4">
    <SkeletonBase className="h-8 w-full mb-6" />
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <SkeletonBase className="h-4 w-4" />
          <SkeletonBase className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

// List skeleton with avatar
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 card">
        <SkeletonBase className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <SkeletonBase className="h-4 w-32 mb-2" />
          <SkeletonBase className="h-3 w-48" />
        </div>
        <SkeletonBase className="h-6 w-16" />
      </div>
    ))}
  </div>
);

// Timeline/activity skeleton
export const ActivitySkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex gap-3">
        <SkeletonBase className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <SkeletonBase className="h-3 w-24" />
            <SkeletonBase className="h-3 w-16" />
          </div>
          <SkeletonBase className="h-4 w-full mb-1" />
          <SkeletonBase className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// Chart skeleton
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className="card p-6">
    <SkeletonBase className="h-5 w-32 mb-4" />
    <div className={`${height} flex items-end gap-2`}>
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBase 
          key={i} 
          className="flex-1"
          style={{ height: `${Math.random() * 80 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

// Calendar skeleton
export const CalendarSkeleton: React.FC = () => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-6">
      <SkeletonBase className="h-6 w-32" />
      <div className="flex gap-2">
        <SkeletonBase className="h-8 w-8" />
        <SkeletonBase className="h-8 w-8" />
      </div>
    </div>
    <div className="grid grid-cols-7 gap-1 mb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBase key={i} className="h-8" />
      ))}
    </div>
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <SkeletonBase key={i} className="h-20" />
      ))}
    </div>
  </div>
);

// Timesheet skeleton
export const TimesheetSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-neutral-50 p-4 rounded-lg">
      <div className="flex items-center justify-center gap-4">
        <SkeletonBase className="h-8 w-8" />
        <SkeletonBase className="h-6 w-48" />
        <SkeletonBase className="h-8 w-8" />
      </div>
    </div>
    
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>

    <div className="card p-6">
      <SkeletonBase className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded">
            <SkeletonBase className="h-4 w-4" />
            <SkeletonBase className="h-4 w-64" />
          </div>
        ))}
      </div>
      <SkeletonBase className="h-10 w-32 mt-6" />
    </div>
  </div>
);

// Page skeleton wrapper
export const PageSkeleton: React.FC<{ 
  children?: React.ReactNode;
  showNavigation?: boolean;
}> = ({ children, showNavigation = true }) => (
  <div className="min-h-screen bg-neutral-50 flex">
    {showNavigation && <NavigationSkeleton />}
    <div className={`flex-1 ${showNavigation ? 'lg:ml-0' : ''}`}>
      <div className="p-8">
        <SkeletonBase className="h-8 w-64 mb-2" />
        <SkeletonBase className="h-4 w-96 mb-8" />
        {children}
      </div>
    </div>
  </div>
);

// Progressive skeleton that reduces over time
export const ProgressiveSkeleton: React.FC<{
  children: React.ReactNode;
  loading: boolean;
  delay?: number;
}> = ({ children, loading, delay = 200 }) => {
  const [showSkeleton, setShowSkeleton] = React.useState(loading);

  React.useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowSkeleton(false), delay);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [loading, delay]);

  if (showSkeleton) {
    return <>{children}</>;
  }

  return null;
};