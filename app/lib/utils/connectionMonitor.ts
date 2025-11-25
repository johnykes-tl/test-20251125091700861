'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// 1. Define the shape of the connection state
interface ConnectionState {
  isOnline: boolean;
  isHealthy: boolean;
  latency: number | null;
  failureCount: number;
}

// 2. Create the context with an initial undefined value
const ConnectionContext = createContext<ConnectionState | undefined>(undefined);

// 3. Define the initial state for our connection monitor
const initialState: ConnectionState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isHealthy: true,
  latency: null,
  failureCount: 0,
};

// 4. Create a singleton state manager outside of React components
// This ensures the health check runs regardless of component mounts/unmounts.
let connectionState = { ...initialState };
const listeners = new Set<(state: ConnectionState) => void>();

function updateState(newState: Partial<ConnectionState>) {
  connectionState = { ...connectionState, ...newState };
  // Notify all subscribed components of the state change
  listeners.forEach(listener => listener(connectionState));
}

// 5. Set up the monitoring logic (only runs in the browser)
if (typeof window !== 'undefined') {
  // Listen to browser's native online/offline events
  const updateOnlineStatus = () => {
    updateState({ isOnline: navigator.onLine });
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Periodically check server health
  setInterval(async () => {
    if (!navigator.onLine) {
      updateState({ isHealthy: false, latency: null });
      return;
    }

    try {
      const startTime = Date.now();
      const response = await fetch('/api/health-check', {
        method: 'GET',
        cache: 'no-store',
      });
      const latency = Date.now() - startTime;

      if (response.ok) {
        updateState({ isHealthy: true, latency, failureCount: 0 });
      } else {
        updateState({ isHealthy: false, latency, failureCount: connectionState.failureCount + 1 });
      }
    } catch (error) {
      updateState({ isHealthy: false, latency: null, failureCount: connectionState.failureCount + 1 });
    }
  }, 15000); // Check every 15 seconds
}

// 6. Create the Provider component to wrap the application
export function ConnectionStateProvider({ children }: { children: ReactNode }) {
  // This state will sync with the global connectionState
  const [state, setState] = useState(connectionState);

  useEffect(() => {
    // Define the listener function for this component instance
    const listener = (newState: ConnectionState) => {
      setState(newState);
    };

    // Subscribe to the global state changes
    listeners.add(listener);

    // Cleanup: unsubscribe when the component unmounts
    return () => {
      listeners.delete(listener);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Provide the current state to all children using React.createElement to avoid JSX
  return React.createElement(ConnectionContext.Provider, { value: state }, children);
}

// 7. Create a custom hook for easy access to the connection state
export function useConnectionState() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    // This error ensures the hook is used within the provider's scope
    throw new Error('useConnectionState must be used within a ConnectionStateProvider');
  }
  return context;
}