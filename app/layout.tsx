import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import RouteGuard from './components/RouteGuard';
import { ConnectionStateProvider } from './lib/utils/connectionMonitor';
import { PerformanceProvider } from './components/PerformanceProvider';
import { RealTimeProvider } from './components/RealTimeProvider';
import './globals.css';

export const metadata = {
  title: 'Employee Timesheet Platform',
  description: 'Sistem de management pontaj și concedii pentru angajați',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ro">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ConnectionStateProvider>
          <PerformanceProvider>
          <AuthProvider>
            <RealTimeProvider>
            <RouteGuard>
              {children}
            </RouteGuard>
            </RealTimeProvider>
          </AuthProvider>
          </PerformanceProvider>
        </ConnectionStateProvider>
      </body>
    </html>
  )
}