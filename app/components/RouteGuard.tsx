'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [canRender, setCanRender] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Debug logging helper
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`[RouteGuard] ${logEntry}`);
    setDebugInfo(prev => [...prev.slice(-4), logEntry]); // Keep last 5 logs
  }, []);

  // Effect to handle tab visibility change for automatic refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only refresh if the tab becomes visible, the user is logged in, and not on the login page
      if (document.visibilityState === 'visible' && user && pathname !== '/') {
        addDebugLog('Tab became visible, refreshing page for data consistency.');
        window.location.reload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup listener on component unmount
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, pathname, addDebugLog]);

  useEffect(() => {
    const processingStart = Date.now();
    
    if (loading) {
      addDebugLog(`Auth loading state, canRender set to false`);
      setCanRender(false);
      return;
    }

    addDebugLog(`Processing route: ${pathname}, hasUser: ${!!user}, userRole: ${user?.role}`);
    
    // Reset redirect state
    setIsRedirecting(false);

    // Public routes (login page)
    if (pathname === '/') {
      if (!user) {
        addDebugLog('Public route, no user - showing login page');
        setCanRender(true);
      } else {
        addDebugLog(`User logged in, redirecting to dashboard (role: ${user.role})`);
        setIsRedirecting(true);
        setCanRender(false);
        
        if (user.role === 'admin') {
          addDebugLog('Redirecting admin to /admin/dashboard');
          router.replace('/admin/dashboard');
        } else {
          addDebugLog('Redirecting employee to /employee/timesheet');
          router.replace('/employee/timesheet');
        }
      }
      return;
    }

    // Protected routes - no user
    if (!user) {
      addDebugLog('Protected route, no user - redirecting to login');
      setIsRedirecting(true);
      setCanRender(false);
      router.replace('/');
      return;
    }

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (user.role === 'admin') {
        addDebugLog('Admin route, admin user - allowing access');
        setCanRender(true);
      } else {
        addDebugLog(`Admin route, non-admin user (${user.role}) - redirecting to employee area`);
        setIsRedirecting(true);
        setCanRender(false);
        router.replace('/employee/timesheet');
      }
      return;
    }

    // Employee routes
    if (pathname.startsWith('/employee')) {
      if (user.role === 'employee') {
        const processingTime = Date.now() - processingStart;
        addDebugLog(`Employee route, employee user - ALLOWING ACCESS (processed in ${processingTime}ms)`);
        
        // Use setTimeout to ensure state update happens in next tick
        setTimeout(() => {
          setCanRender(true);
          addDebugLog('✅ canRender set to true for employee route');
        }, 0);
      } else {
        addDebugLog(`Employee route, non-employee user (${user.role}) - redirecting to admin area`);
        setIsRedirecting(true);
        setCanRender(false);
        router.replace('/admin/dashboard');
      }
      return;
    }

    // Default case
    addDebugLog('Default case - allowing access');
    setCanRender(true);
  }, [user, loading, pathname, router, addDebugLog]);

  // Add a timeout safety net for stuck states
  useEffect(() => {
    if (!loading && user && pathname.startsWith('/employee') && user.role === 'employee' && !canRender && !isRedirecting) {
      const timeout = setTimeout(() => {
        addDebugLog('⚠️ TIMEOUT SAFETY: Force enabling canRender after 2 seconds');
        setCanRender(true);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [loading, user, pathname, canRender, isRedirecting, addDebugLog]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Se încarcă autentificarea...</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-neutral-500">
              <p>Debug: Auth loading state</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Redirecting state
  if (isRedirecting || (!canRender && user)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Se redirecționează...</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-neutral-500">
              <p>Debug: {isRedirecting ? 'Redirecting...' : 'Waiting for route access...'}</p>
              <div className="mt-2">
                {debugInfo.slice(-3).map((log, index) => (
                  <p key={index} className="text-xs">{log}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Final safety check with detailed error info
  if (!canRender) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-danger-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Acces restricționat</h3>
          <p className="text-neutral-600 mb-4">Nu aveți permisiunea să accesați această pagină.</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-left max-w-md mx-auto bg-neutral-100 p-3 rounded">
              <p className="font-medium mb-2">Debug Info:</p>
              <p>Pathname: {pathname}</p>
              <p>User: {user ? 'Present' : 'Null'}</p>
              <p>Role: {user?.role || 'N/A'}</p>
              <p>Loading: {loading.toString()}</p>
              <p>CanRender: {canRender.toString()}</p>
              <p>IsRedirecting: {isRedirecting.toString()}</p>
              <div className="mt-2">
                <p className="font-medium">Recent logs:</p>
                {debugInfo.map((log, index) => (
                  <p key={index} className="text-xs">{log}</p>
                ))}
              </div>
            </div>
          )}
          <button 
            onClick={() => router.replace('/')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Înapoi la login
          </button>
        </div>
      </div>
    );
  }

  // Success - render children with error boundary
  return (
    <ErrorBoundary pathname={pathname} user={user}>
      {children}
    </ErrorBoundary>
  );
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; pathname: string; user: any },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; pathname: string; user: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[RouteGuard ErrorBoundary] Component mounting error:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      pathname: this.props.pathname,
      userRole: this.props.user?.role
    });
    
    this.setState({ error, errorInfo });
  }

  componentDidUpdate(prevProps: { pathname: string }) {
    // Reset error state when navigating to a new route
    if (prevProps.pathname !== this.props.pathname && this.state.hasError) {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-danger-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">Eroare de încărcare</h3>
            <p className="text-neutral-600 mb-4">
              A apărut o eroare neașteptată la încărcarea paginii. Vă rugăm să încercați din nou.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-danger-50 p-4 rounded-lg mb-4 text-sm">
                <p className="font-medium text-danger-900">Error Details:</p>
                <p className="text-danger-800 mt-1">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-xs text-danger-700 mt-2 overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Reîncarcă pagina
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300"
              >
                Înapoi la login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}