import React from 'react';
import { X } from 'lucide-react';

interface PerformanceMetrics {
  operations: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
    slowestOperation: { name: string; time: number } | null;
  };
  cache: {
    entries: number;
    hitRate: number;
    freshEntries: number;
    staleEntries: number;
    ongoingRefreshes: number;
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    usagePercentage: number;
  };
  connections: {
    active: number;
    errors: number;
    avgLatency: number;
  };
}

interface PerformanceOverlayProps {
  metrics: PerformanceMetrics;
  isVisible: boolean;
  onClose: () => void;
}

export default function PerformanceOverlay({ metrics, isVisible, onClose }: PerformanceOverlayProps) {
  if (!isVisible) return null;

  const getSuccessRate = () => {
    if (metrics.operations.total === 0) return 0;
    return Math.round((metrics.operations.successful / metrics.operations.total) * 100);
  };

  const getMemoryStatus = () => {
    if (metrics.memory.usagePercentage > 80) return 'text-red-400';
    if (metrics.memory.usagePercentage > 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-green-400">Performance Metrics</h4>
        <button
          onClick={onClose}
          className="text-white hover:text-red-400 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <h5 className="text-blue-400 font-semibold mb-1">Operations</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Total: <span className="text-white">{metrics.operations.total}</span></div>
            <div>Success: <span className="text-green-400">{getSuccessRate()}%</span></div>
            <div>Failed: <span className="text-red-400">{metrics.operations.failed}</span></div>
            <div>Avg Time: <span className="text-yellow-400">{metrics.operations.avgResponseTime}ms</span></div>
          </div>
          {metrics.operations.slowestOperation && (
            <div className="text-xs mt-1">
              Slowest: <span className="text-orange-400">
                {metrics.operations.slowestOperation.name} ({metrics.operations.slowestOperation.time}ms)
              </span>
            </div>
          )}
        </div>

        <div>
          <h5 className="text-blue-400 font-semibold mb-1">Cache</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Entries: <span className="text-white">{metrics.cache.entries}</span></div>
            <div>Hit Rate: <span className="text-green-400">{metrics.cache.hitRate}%</span></div>
            <div>Fresh: <span className="text-green-400">{metrics.cache.freshEntries}</span></div>
            <div>Stale: <span className="text-yellow-400">{metrics.cache.staleEntries}</span></div>
          </div>
          {metrics.cache.ongoingRefreshes > 0 && (
            <div className="text-xs mt-1">
              Refreshing: <span className="text-blue-400">{metrics.cache.ongoingRefreshes}</span>
            </div>
          )}
        </div>

        <div>
          <h5 className="text-blue-400 font-semibold mb-1">Memory</h5>
          <div className="text-xs">
            <div>Used: <span className={getMemoryStatus()}>{metrics.memory.usedJSHeapSize}MB</span></div>
            <div>Total: <span className="text-white">{metrics.memory.totalJSHeapSize}MB</span></div>
            <div>Usage: <span className={getMemoryStatus()}>{metrics.memory.usagePercentage}%</span></div>
          </div>
        </div>

        <div>
          <h5 className="text-blue-400 font-semibold mb-1">Connections</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Active: <span className="text-green-400">{metrics.connections.active}</span></div>
            <div>Errors: <span className="text-red-400">{metrics.connections.errors}</span></div>
          </div>
          {metrics.connections.avgLatency > 0 && (
            <div className="text-xs mt-1">
              Latency: <span className="text-yellow-400">{metrics.connections.avgLatency}ms</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-400">
          Press Ctrl+Shift+P to toggle
        </div>
      </div>
    </div>
  );
}