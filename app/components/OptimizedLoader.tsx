'use client';

import React from 'react';
import { RefreshCw, Wifi, Database, CheckCircle, AlertTriangle } from 'lucide-react';
interface OptimizedLoaderProps {
  loading: boolean;
  progress: number;
  stage: string;
  error?: string | null;
  isStale?: boolean;
  className?: string;
}

export default function OptimizedLoader({ 
  loading, 
  progress, 
  stage, 
  error, 
  isStale = false,
  className = '' 
}: OptimizedLoaderProps) {
  const getStageIcon = () => {
    switch (stage) {
      case 'connecting':
        return <Wifi className="h-4 w-4" />;
      case 'fetching':
        return <Database className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
  };

  const getStageText = () => {
    switch (stage) {
      case 'initializing':
        return 'Initializing...';
      case 'checking-cache':
        return 'Checking cache...';
      case 'connecting':
        return 'Connecting...';
      case 'fetching':
        return 'Loading data...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Complete';
      case 'fallback':
        return 'Using cached data';
      case 'error':
        return 'Error occurred';
      default:
        return 'Loading...';
    }
  };

  if (!loading && !error && !isStale) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {loading && (
        <>
          <div className="flex items-center gap-2">
            {getStageIcon()}
            <span className="text-sm text-neutral-600">{getStageText()}</span>
          </div>
          
          {progress > 0 && (
            <div className="flex-1 max-w-32">
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500 mt-1">{Math.round(progress)}%</span>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="flex items-center gap-2 text-warning-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{isStale ? 'Using cached data' : 'Connection error'}</span>
        </div>
      )}

      {isStale && !loading && (
        <div className="flex items-center gap-2 text-warning-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Using offline data</span>
        </div>
      )}
    </div>
  );
}