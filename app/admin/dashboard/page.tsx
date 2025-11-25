import React, { Suspense } from 'react';
import DashboardClient from './DashboardClient';
import { RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardClient />
    </Suspense>
  );
}
function DashboardLoadingSkeleton() {
  return (
    <DashboardLayout userRole="admin" pendingLeaveRequests={0}>
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-neutral-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}