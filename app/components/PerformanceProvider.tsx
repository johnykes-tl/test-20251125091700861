'use client';

import React, { createContext, useContext } from 'react';
import { usePerformanceOptimization } from '../lib/hooks/usePerformanceOptimization';
import PerformanceOverlay from './PerformanceOverlay';

interface PerformanceContextType {
  metrics: any;
  showMetrics: boolean;
  setShowMetrics: (show: boolean) => void;
  clearMetrics: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

interface PerformanceProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export function PerformanceProvider({ children, enabled = process.env.NODE_ENV === 'development' }: PerformanceProviderProps) {
  const performanceData = usePerformanceOptimization(enabled);

  const contextValue: PerformanceContextType = {
    metrics: performanceData.metrics,
    showMetrics: performanceData.showMetrics,
    setShowMetrics: performanceData.setShowMetrics,
    clearMetrics: performanceData.clearMetrics
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      {/* Render performance overlay if enabled */}
      <PerformanceOverlay 
        metrics={performanceData.metrics}
        isVisible={performanceData.showMetrics}
        onClose={() => performanceData.setShowMetrics(false)}
      />
    </PerformanceContext.Provider>
  );
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within PerformanceProvider');
  }
  return context;
}