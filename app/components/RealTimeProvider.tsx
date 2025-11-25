'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import useRealTimeUpdates from '../lib/hooks/useRealTimeUpdates';
import { useAuth } from '../contexts/AuthContext';

interface RealTimeContextType {
  isConnected: boolean;
  connectionError: string | null;
  lastUpdate: string | null;
  updateCount: number;
}

const RealTimeContext = createContext<RealTimeContextType>({
  isConnected: false,
  connectionError: null,
  lastUpdate: null,
  updateCount: 0
});

interface RealTimeProviderProps {
  children: React.ReactNode;
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Set up real-time updates with handlers
  const realTimeConnection = useRealTimeUpdates({
    onConnection: (connected) => {
      setIsConnected(connected);
      if (connected) {
        setConnectionError(null);
        console.log('✅ Real-time connection established');
      } else {
        console.log('🔌 Real-time connection lost');
      }
    },

    onError: (error) => {
      setConnectionError(error);
      setIsConnected(false);
      console.error('❌ Real-time connection error:', error);
    },

    onEmployeeUpdate: (employee) => {
      console.log('👤 Employee updated via real-time:', employee);
      setLastUpdate(new Date().toISOString());
      setUpdateCount(prev => prev + 1);
      
      // Broadcast custom event for components to listen to
      window.dispatchEvent(new CustomEvent('employeeUpdate', { detail: employee }));
    },

    onLeaveRequestUpdate: (request) => {
      console.log('🏖️ Leave request updated via real-time:', request);
      setLastUpdate(new Date().toISOString());
      setUpdateCount(prev => prev + 1);
      
      window.dispatchEvent(new CustomEvent('leaveRequestUpdate', { detail: request }));
    },

    onTimesheetUpdate: (entry) => {
      console.log('📋 Timesheet updated via real-time:', entry);
      setLastUpdate(new Date().toISOString());
      setUpdateCount(prev => prev + 1);
      
      window.dispatchEvent(new CustomEvent('timesheetUpdate', { detail: entry }));
    },

    onTestAssignmentUpdate: (assignment) => {
      console.log('🧪 Test assignment updated via real-time:', assignment);
      setLastUpdate(new Date().toISOString());
      setUpdateCount(prev => prev + 1);
      
      window.dispatchEvent(new CustomEvent('testAssignmentUpdate', { detail: assignment }));
    },

    onDashboardStatsUpdate: (stats) => {
      console.log('📊 Dashboard stats updated via real-time:', stats);
      setLastUpdate(new Date().toISOString());
      setUpdateCount(prev => prev + 1);
      
      window.dispatchEvent(new CustomEvent('dashboardStatsUpdate', { detail: stats }));
    }
  });

  const contextValue: RealTimeContextType = {
    isConnected,
    connectionError,
    lastUpdate,
    updateCount
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTimeContext() {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTimeContext must be used within RealTimeProvider');
  }
  return context;
}

// Custom hooks for specific real-time data
export function useRealTimeEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const handleEmployeeUpdate = (event: CustomEvent) => {
      setEmployees(prev => {
        const updated = event.detail;
        return prev.map(emp => emp.id === updated.id ? updated : emp);
      });
    };

    window.addEventListener('employeeUpdate', handleEmployeeUpdate as EventListener);
    return () => window.removeEventListener('employeeUpdate', handleEmployeeUpdate as EventListener);
  }, []);

  return { employees, setEmployees };
}

export function useRealTimeLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  useEffect(() => {
    const handleLeaveUpdate = (event: CustomEvent) => {
      setLeaveRequests(prev => {
        const updated = event.detail;
        return prev.map(req => req.id === updated.id ? updated : req);
      });
    };

    window.addEventListener('leaveRequestUpdate', handleLeaveUpdate as EventListener);
    return () => window.removeEventListener('leaveRequestUpdate', handleLeaveUpdate as EventListener);
  }, []);

  return { leaveRequests, setLeaveRequests };
}

export function useRealTimeDashboard() {
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
    const handleStatsUpdate = (event: CustomEvent) => {
      setDashboardStats(event.detail);
    };

    window.addEventListener('dashboardStatsUpdate', handleStatsUpdate as EventListener);
    return () => window.removeEventListener('dashboardStatsUpdate', handleStatsUpdate as EventListener);
  }, []);

  return { dashboardStats, setDashboardStats };
}