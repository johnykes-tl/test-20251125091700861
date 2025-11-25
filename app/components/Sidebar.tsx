'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  Settings,
  LogOut,
  TestTube,
  ClipboardList,
} from 'lucide-react';
import { leaveRequestsApi } from '../lib/api/leaveRequestsApi';
interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

interface SidebarProps {
  userRole: 'admin' | 'employee';
  isOpen?: boolean;
  onToggle?: () => void;
  pendingLeaveRequests?: number;
}

export default function Sidebar({ userRole, isOpen = false, onToggle, pendingLeaveRequests: propPendingCount }: SidebarProps) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [realPendingCount, setRealPendingCount] = useState(propPendingCount || 0);

  // Load real pending count for admin users
  useEffect(() => {
    const loadPendingCount = async () => {
      if (userRole === 'admin') {
        try {
          const count = await leaveRequestsApi.getPendingLeaveRequestsCount();
          setRealPendingCount(count);
        } catch (error) {
          console.error('❌ Error loading pending requests count:', error);
          setRealPendingCount(propPendingCount || 0);
        }
      }
    };

    loadPendingCount();
    
    const interval = setInterval(loadPendingCount, 60000);
    return () => clearInterval(interval);
  }, [userRole, propPendingCount]);

  const pendingCount = userRole === 'admin' ? realPendingCount : 0;

  const adminMenuItems: MenuItem[] = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/employees', icon: Users, label: 'Angajați' },
    { href: '/admin/timesheet', icon: Clock, label: 'Pontaj' },
    { href: '/admin/leave-requests', icon: Calendar, label: 'Concedii', badge: pendingCount },
    { href: '/admin/tests', icon: TestTube, label: 'Management Teste' },
    { href: '/admin/test-assignments', icon: ClipboardList, label: 'Assignări Teste' },
    { href: '/admin/reports', icon: FileText, label: 'Rapoarte' },
    { href: '/admin/settings', icon: Settings, label: 'Configurare' },
  ];

  const employeeMenuItems: MenuItem[] = [
    { href: '/employee/timesheet', icon: Clock, label: 'Pontaj' },
    { href: '/employee/tests', icon: TestTube, label: 'Testele Mele' },
    { href: '/employee/leave', icon: Calendar, label: 'Concediu' },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : employeeMenuItems;

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLinkClick = () => {
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <>
      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-neutral-900 text-lg leading-tight">Timesheet App</h2>
              <p className="text-sm text-neutral-500 capitalize truncate">
                {userRole} - {user?.email?.split('@')[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`sidebar-link ${isActive ? 'active' : ''} group`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-danger-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center flex-shrink-0">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-200 bg-white">
          <button 
            onClick={handleLogout}
            className="sidebar-link w-full text-danger-600 hover:text-danger-700 hover:bg-danger-50 group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 truncate">Deconectare</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}