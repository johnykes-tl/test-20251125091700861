'use client';

import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangle' | 'circle' | 'card' | 'table' | 'dashboard' | 'form';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangle',
  width,
  height,
  count = 1,
  className = '',
  animate = true
}) => {
  const baseClasses = `bg-neutral-200 ${animate ? 'animate-pulse' : ''} ${className}`;

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circle':
        return 'rounded-full';
      case 'card':
        return 'rounded-lg h-32';
      case 'rectangle':
      default:
        return 'rounded';
    }
  };

  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  const SkeletonItem = () => (
    <div
      className={`${baseClasses} ${getVariantClasses()}`}
      style={getStyle()}
    />
  );

  if (variant === 'dashboard') {
    return (
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 bg-neutral-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-1/2 animate-pulse" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-neutral-200 rounded-lg" />
                <div className="w-4 h-4 bg-neutral-200 rounded" />
              </div>
              <div className="h-8 bg-neutral-200 rounded w-16 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-20 mb-1" />
              <div className="h-3 bg-neutral-200 rounded w-16" />
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <div className="w-8 h-8 bg-neutral-200 rounded" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                  <div className="w-16 h-6 bg-neutral-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border animate-pulse">
            <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 h-4 bg-neutral-200 rounded" />
                  <div className="flex-1 bg-neutral-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-neutral-200 rounded-full animate-pulse" style={{ width: `${Math.random() * 100}%` }} />
                  </div>
                  <div className="w-12 h-4 bg-neutral-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="bg-white rounded-lg border animate-pulse">
        {/* Table Header */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex gap-4">
            <div className="h-4 bg-neutral-200 rounded w-32" />
            <div className="h-4 bg-neutral-200 rounded w-24" />
            <div className="h-4 bg-neutral-200 rounded w-28" />
            <div className="h-4 bg-neutral-200 rounded w-20" />
            <div className="h-4 bg-neutral-200 rounded w-16" />
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-neutral-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
                <div className="w-20 h-4 bg-neutral-200 rounded" />
                <div className="w-16 h-6 bg-neutral-200 rounded-full" />
                <div className="w-8 h-8 bg-neutral-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="bg-white p-6 rounded-lg border space-y-6 animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-1/3" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-24" />
              <div className="h-10 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 rounded w-32" />
          <div className="h-24 bg-neutral-200 rounded" />
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-neutral-200">
          <div className="h-10 bg-neutral-200 rounded w-24" />
          <div className="h-10 bg-neutral-200 rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </>
  );
};

export default SkeletonLoader;

// Preset skeleton components for common use cases
export const DashboardSkeleton = () => <SkeletonLoader variant="dashboard" />;
export const TableSkeleton = () => <SkeletonLoader variant="table" />;
export const FormSkeleton = () => <SkeletonLoader variant="form" />;
export const CardSkeleton = () => <SkeletonLoader variant="card" />;
export const TextSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLoader 
        key={i} 
        variant="text" 
        width={i === lines - 1 ? '75%' : '100%'} 
      />
    ))}
  </div>
);