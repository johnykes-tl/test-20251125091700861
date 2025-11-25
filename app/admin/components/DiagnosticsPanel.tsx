'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Settings, Database, Wrench } from 'lucide-react';
import { diagnosticsService, type DatabaseHealthCheck } from '../../lib/services/diagnosticsService';

interface DiagnosticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiagnosticsPanel({ isOpen, onClose }: DiagnosticsPanelProps) {
  const [healthCheck, setHealthCheck] = useState<DatabaseHealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairResults, setRepairResults] = useState<{ success: boolean; message: string; actions: string[] } | null>(null);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await diagnosticsService.performHealthCheck();
      setHealthCheck(result);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runRepair = async () => {
    setRepairing(true);
    setRepairResults(null);
    try {
      const result = await diagnosticsService.repairDatabase();
      setRepairResults(result);
      
      // Re-run health check after repair
      if (result.success) {
        setTimeout(() => runHealthCheck(), 1000);
      }
    } catch (error) {
      console.error('Repair failed:', error);
      setRepairResults({
        success: false,
        message: 'Repair failed with error',
        actions: [`Error: ${error}`]
      });
    } finally {
      setRepairing(false);
    }
  };

  const initializeSampleData = async () => {
    setLoading(true);
    try {
      const result = await diagnosticsService.initializeSampleData();
      if (result.success) {
        setTimeout(() => runHealthCheck(), 1000);
      }
      alert(result.message);
    } catch (error) {
      console.error('Sample data initialization failed:', error);
      alert('Failed to initialize sample data');
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-warning-600" />;
      case 'critical':
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-danger-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return 'text-success-700 bg-success-50';
      case 'degraded':
        return 'text-warning-700 bg-warning-50';
      case 'critical':
      case 'failed':
      case 'error':
        return 'text-danger-700 bg-danger-50';
      default:
        return 'text-neutral-700 bg-neutral-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-neutral-900">System Diagnostics & Repair</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runHealthCheck}
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Run Health Check
            </button>
            
            <button
              onClick={runRepair}
              disabled={repairing}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {repairing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
              Auto Repair
            </button>

            <button
              onClick={initializeSampleData}
              disabled={loading}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <Settings className="h-4 w-4" />
              Initialize Sample Data
            </button>
          </div>

          {/* Repair Results */}
          {repairResults && (
            <div className={`p-4 rounded-lg border ${repairResults.success ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
              <h4 className={`font-medium mb-2 ${repairResults.success ? 'text-success-900' : 'text-danger-900'}`}>
                Repair Results: {repairResults.message}
              </h4>
              {repairResults.actions.length > 0 && (
                <ul className={`text-sm space-y-1 ${repairResults.success ? 'text-success-700' : 'text-danger-700'}`}>
                  {repairResults.actions.map((action, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span>•</span> {action}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Health Check Results */}
          {healthCheck && (
            <div className="space-y-6">
              {/* Overall Health */}
              <div className={`p-4 rounded-lg border ${getHealthColor(healthCheck.overallHealth)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getHealthIcon(healthCheck.overallHealth)}
                  <h3 className="text-lg font-semibold">
                    Overall System Health: {healthCheck.overallHealth.toUpperCase()}
                  </h3>
                </div>
                <p className="text-sm">
                  Connection: {healthCheck.connection}, 
                  Tables: {healthCheck.tables.filter(t => t.status === 'ok').length}/{healthCheck.tables.length}, 
                  Services: {healthCheck.services.filter(s => s.status === 'ok').length}/{healthCheck.services.length}
                </p>
              </div>

              {/* Tables Status */}
              <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-3">Database Tables</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {healthCheck.tables.map((table, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getHealthColor(table.status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getHealthIcon(table.status)}
                          <span className="font-medium">{table.name}</span>
                        </div>
                        {table.recordCount !== undefined && (
                          <span className="text-sm">{table.recordCount} records</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services Status */}
              <div>
                <h4 className="text-lg font-semibold text-neutral-900 mb-3">Services Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {healthCheck.services.map((service, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getHealthColor(service.status)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {getHealthIcon(service.status)}
                        <span className="font-medium">{service.name}</span>
                      </div>
                      {service.error && (
                        <p className="text-xs text-danger-600">{service.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {healthCheck.recommendations.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 mb-3">Recommendations</h4>
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <ul className="text-sm text-warning-700 space-y-2">
                      {healthCheck.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Initial State */}
          {!healthCheck && !loading && (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600">Click "Run Health Check" to diagnose system issues</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}