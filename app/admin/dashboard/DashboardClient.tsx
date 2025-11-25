'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import { Users, Clock, Calendar, TrendingUp, CheckCircle, RefreshCw, AlertCircle, XCircle, Settings } from 'lucide-react';
import { dashboardApi } from '../../lib/api/dashboardApi';
import { diagnosticsService } from '../../lib/services/diagnosticsService';
import type { DashboardStats, WeeklyAttendanceDay } from '../../lib/services/dashboardService';
import type { RecentActivity } from '../../lib/services/recentActivityService';

// Create a more flexible local type to accommodate all possible health states
type DashboardClientStats = Omit<DashboardStats, 'systemHealth'> & {
  systemHealth: 'healthy' | 'degraded' | 'critical' | 'unknown' | 'error' | 'ok' | 'failed';
};

export default function DashboardClient() {
   const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 const [showDiagnostics, setShowDiagnostics] = useState(false);
  
   // Dynamic state - loaded client-side
  const [stats, setStats] = useState<DashboardClientStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    completedTimesheets: 0,
    incompleteTimesheets: 0,
    absentEmployees: 0,
    attendanceRate: 0,
    weeklyAttendanceRate: 0,
    monthlyAttendanceRate: 0,
    totalLeaveRequests: 0,
    pendingLeaveRequests: 0,
    systemHealth: 'unknown',
    errors: []
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendanceDay[]>([]);
 
  const [showHealthDetails, setShowHealthDetails] = useState(false);

   // Load data on component mount and set up auto-refresh
  useEffect(() => {
    loadDashboardData(false); // Initial load not silent
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('🔄 Loading real-time dashboard data...');
      
      const data = await dashboardApi.getDashboardPageData();
      
      if (data.error) {
        setError(data.error);
      } else {
        setStats(data.stats as DashboardClientStats);
        setRecentActivity(data.recentActivity);
        setWeeklyAttendance(data.weeklyAttendance);
        
        console.log('✅ Real-time dashboard data loaded:', {
          timestamp: new Date().toLocaleTimeString(),
          stats: data.stats,
          activitiesCount: data.recentActivity.length,
          weeklyDaysCount: data.weeklyAttendance.length
        });
      }

    } catch (error: any) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };
  const handleRefresh = () => {
    loadDashboardData();
  };
 const runHealthCheck = async () => {
   try {
      console.log('🏥 Running system health check...');
      const healthCheck = await diagnosticsService.performHealthCheck();
      
      setStats(prev => ({
        ...prev,
        systemHealth: healthCheck.overallHealth as DashboardClientStats['systemHealth'],
        errors: healthCheck.recommendations || []
      }));

      if (healthCheck.overallHealth === 'healthy') {
        setError(null);
      } else {
        setError(`System health: ${healthCheck.overallHealth}. ${healthCheck.recommendations.join(', ')}`);
      }

      setShowHealthDetails(true);
      setTimeout(() => setShowHealthDetails(false), 5000);

    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      setError('Health check failed: ' + error.message);
    }
  };

   // Show loading state on initial load
  if (loading && stats.totalEmployees === 0) {
    return (
      <DashboardLayout userRole="admin" pendingLeaveRequests={0}>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading real-time dashboard data...</p>
              <p className="text-sm text-neutral-500 mt-2">Fetching latest statistics from database...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

 const getHealthBadgeColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-success-100 text-success-700';
      case 'degraded':
        return 'bg-warning-100 text-warning-700';
      case 'critical':
      case 'error':
        return 'bg-danger-100 text-danger-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4" />;
      case 'critical':
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const statItems = [
    {
      title: 'Total Angajați',
      value: stats.totalEmployees.toString(),
      change: `${stats.activeEmployees} activi`,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Pontaj Astăzi',
      value: `${stats.completedTimesheets + stats.incompleteTimesheets}/${stats.totalEmployees}`,
      change: `${stats.attendanceRate}% prezență astăzi`,
      icon: CheckCircle,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Pontaje Complete',
      value: stats.completedTimesheets.toString(),
      change: `${stats.incompleteTimesheets} incomplete, ${stats.absentEmployees} absenți`,
      icon: Calendar,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Cereri Concediu',
      value: stats.totalLeaveRequests.toString(),
      change: `${stats.pendingLeaveRequests} în așteptare`,
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50'
    }
  ];

  const getActivityIcon = (activity: RecentActivity) => {
    switch (activity.status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString('ro-RO');
    }
  };

  return (
    <DashboardLayout userRole="admin" pendingLeaveRequests={stats.pendingLeaveRequests}>
      <div className="p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-neutral-900">Dashboard Administrator</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getHealthBadgeColor(stats.systemHealth)}`}>
                {getHealthIcon(stats.systemHealth)}
                {stats.systemHealth.toUpperCase()}
              </span>
               <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                LIVE
              </span>
           </div>
            <div className="space-y-1">
              <p className="text-neutral-600">Privire de ansamblu asupra activității angajaților</p>
               <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span>🔄 Actualizare automată la fiecare 30s</span>
              </div>
             <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span>📊 Prezență astăzi: {stats.attendanceRate}%</span>
                <span>📅 Media săptămânii: {stats.weeklyAttendanceRate}%</span>
                <span>📆 Media lunii: {stats.monthlyAttendanceRate}%</span>
              </div>
            </div>
            {stats.errors.length > 0 && (
              <p className="text-xs text-warning-600 mt-1">
                {stats.errors.length} service issue{stats.errors.length > 1 ? 's' : ''} detected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDiagnostics(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Diagnostics
            </button>
            <button 
              onClick={runHealthCheck}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Health Check
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-danger-700">{error}</p>
              {stats.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-danger-600 cursor-pointer">View detailed errors</summary>
                  <ul className="text-xs text-danger-600 mt-1 ml-4 list-disc">
                    {stats.errors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-danger-600 hover:text-danger-700"
            >
              ×
            </button>
          </div>
        )}

        {showHealthDetails && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="font-medium text-primary-900 mb-2">🏥 System Health Check Results</h4>
            <p className="text-sm text-primary-700">
              System Status: <strong>{stats.systemHealth.toUpperCase()}</strong>
            </p>
            {stats.errors.length === 0 ? (
              <p className="text-sm text-success-700 mt-1">✅ All services are operating normally</p>
            ) : (
              <div className="text-sm text-warning-700 mt-1">
                ⚠️ {stats.errors.length} issue{stats.errors.length > 1 ? 's' : ''} found:
                <ul className="ml-4 mt-1 list-disc">
                  {stats.errors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statItems.map((stat, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <TrendingUp className="h-4 w-4 text-success-500" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-neutral-600 mb-1">{stat.title}</p>
              <p className="text-xs text-neutral-500">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Activitate Recentă
            </h2>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">Nu există activitate recentă</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50">
                    <div className="text-lg">{getActivityIcon(activity)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {activity.employeeName}
                        </p>
                        <span className="text-xs text-neutral-500 ml-2">
                          {getActivityTime(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">{activity.action}</p>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                      {activity.department && (
                        <span className="inline-block mt-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {activity.department}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Prezența Săptămânii
            </h2>
            {weeklyAttendance.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">Nu există date de prezență</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyAttendance.map((dayData) => (
                  <div key={dayData.day} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-neutral-700 w-16">
                      {dayData.day}
                    </span>
                    <div className="flex-1 bg-neutral-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          dayData.attendanceRate >= 90 ? 'bg-success-500' :
                          dayData.attendanceRate >= 80 ? 'bg-warning-500' :
                          dayData.attendanceRate >= 70 ? 'bg-orange-500' : 
                          dayData.attendanceRate > 0 ? 'bg-danger-500' : 'bg-neutral-300'
                        }`}
                        style={{ width: `${Math.max(dayData.attendanceRate, 5)}%` }}
                      ></div>
                    </div>
                    <div className="text-right w-20">
                      <span className="text-sm font-semibold text-neutral-600">
                        {dayData.attendanceRate}%
                      </span>
                      {dayData.totalCount > 0 && (
                        <div className="text-xs text-neutral-500">
                          {dayData.completedCount}/{dayData.totalCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DiagnosticsPanel 
        isOpen={showDiagnostics} 
        onClose={() => setShowDiagnostics(false)} 
      />
    </DashboardLayout>
  );
}