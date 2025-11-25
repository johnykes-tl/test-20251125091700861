'use client';

import React from 'react';
import { useConnectionState } from '../lib/utils/connectionMonitor';
import { CheckCircle, WifiOff, AlertTriangle } from 'lucide-react';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function ConnectionStatus({ showDetails = false, className = '' }: ConnectionStatusProps) {
  const connectionState = useConnectionState();

  if (connectionState.isOnline && connectionState.isHealthy) {
    return showDetails ? (
      <div className={`flex items-center gap-2 text-success-700 bg-success-50 border border-success-200 px-3 py-2 rounded-full shadow-md ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Conectat ({connectionState.latency}ms)</span>
      </div>
    ) : null;
  }

  if (!connectionState.isOnline) {
    return (
      <div className={`flex items-center gap-2 text-danger-700 bg-danger-50 border border-danger-200 px-3 py-2 rounded-full shadow-md ${className}`}>
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Offline</span>
      </div>
    );
  }

  if (!connectionState.isHealthy) {
    return (
      <div className={`flex items-center gap-2 text-warning-700 bg-warning-50 border border-warning-200 px-3 py-2 rounded-full shadow-md ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Conexiune instabilă</span>
      </div>
    );
  }

  return null;
}