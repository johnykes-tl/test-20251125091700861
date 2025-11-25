import { useState, useEffect, useRef } from 'react';

interface RealTimeUpdateHandlers {
  onConnection?: (connected: boolean) => void;
  onError?: (error: string) => void;
  onEmployeeUpdate?: (employee: any) => void;
  onLeaveRequestUpdate?: (request: any) => void;
  onTimesheetUpdate?: (entry: any) => void;
  onTestAssignmentUpdate?: (assignment: any) => void;
  onDashboardStatsUpdate?: (stats: any) => void;
}

export default function useRealTimeUpdates(handlers: RealTimeUpdateHandlers = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;
  const baseRetryDelay = 1000;

  const connect = () => {
    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log('🔌 Establishing SSE connection...');
      
      // Create new EventSource connection
      const eventSource = new EventSource('/api/real-time-updates');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE connection established');
        setIsConnected(true);
        setError(null);
        setRetryCount(0);
        handlers.onConnection?.(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection':
              console.log('🔗 SSE connection confirmed:', data.message);
              break;
            case 'heartbeat':
              // Silent heartbeat - just log occasionally
              if (Math.random() < 0.1) {
                console.log('💓 SSE heartbeat received');
              }
              break;
            case 'employee_update':
              handlers.onEmployeeUpdate?.(data.data);
              break;
            case 'leave_request_update':
              handlers.onLeaveRequestUpdate?.(data.data);
              break;
            case 'timesheet_update':
              handlers.onTimesheetUpdate?.(data.data);
              break;
            case 'test_assignment_update':
              handlers.onTestAssignmentUpdate?.(data.data);
              break;
            case 'dashboard_stats':
              handlers.onDashboardStatsUpdate?.(data.data);
              break;
            default:
              console.log('📨 Unknown SSE message type:', data.type);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse SSE message:', parseError, event.data);
        }
      };

      eventSource.onerror = (event) => {
        console.error('❌ SSE connection error occurred');
        setIsConnected(false);
        
        // Extract meaningful error information
        let errorMessage = 'Real-time connection lost';
        
        if (event.target) {
          const target = event.target as EventSource;
          switch (target.readyState) {
            case EventSource.CONNECTING:
              errorMessage = 'Reconnecting to real-time updates...';
              break;
            case EventSource.CLOSED:
              errorMessage = 'Real-time connection closed';
              break;
            default:
              errorMessage = 'Real-time connection error';
          }
        }

        setError(errorMessage);
        handlers.onConnection?.(false);
        handlers.onError?.(errorMessage);

        // Attempt reconnection with exponential backoff
        if (retryCount < maxRetries) {
          const delay = baseRetryDelay * Math.pow(2, retryCount);
          console.log(`🔄 Retrying SSE connection in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.log('❌ Max SSE retry attempts reached, stopping reconnection');
          handlers.onError?.('Real-time updates unavailable after multiple retry attempts');
        }
      };

    } catch (connectionError) {
      console.error('❌ Failed to create SSE connection:', connectionError);
      setError('Failed to establish real-time connection');
      handlers.onError?.('Failed to establish real-time connection');
    }
  };

  const disconnect = () => {
    console.log('🔌 Disconnecting SSE...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
    setRetryCount(0);
  };

  // Setup connection on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    error,
    retryCount,
    connect,
    disconnect
  };
}