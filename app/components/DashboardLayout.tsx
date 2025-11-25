'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ConnectionStatus from './ConnectionStatus';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'employee';
  pendingLeaveRequests?: number;
}

export default function DashboardLayout({ 
  children, 
  userRole, 
  pendingLeaveRequests = 0 
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Fixed Desktop Sidebar */}
      <Sidebar 
        userRole={userRole} 
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        pendingLeaveRequests={pendingLeaveRequests}
      />

      {/* Main Content Area */}
      <div className="lg:ml-64">
        {/* Sticky Top Navbar - Only visible on mobile */}
        <nav className="lg:hidden sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Toggle navigation menu"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6 text-neutral-700" />
                ) : (
                  <Menu className="h-6 w-6 text-neutral-700" />
                )}
              </button>
              
              {/* Mobile Logo and Title */}
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-neutral-900">Timesheet App</h1>
              </div>
            </div>
            
            {/* Mobile User Role Badge */}
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
              {userRole}
            </span>
          </div>
        </nav>

        {/* Main Content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Connection Status Indicator */}
        <div className="fixed bottom-4 right-4 z-50">
          <ConnectionStatus showDetails={true} />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
}