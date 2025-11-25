import React from 'react';
import type { TimesheetStats as TimesheetStatsType } from '../../../lib/types/timesheet';

interface TimesheetStatsProps {
  stats: TimesheetStatsType;
}

export default function TimesheetStats({ stats }: TimesheetStatsProps) {
  const completionRate = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;
  const presentEmployees = stats.complete + stats.incomplete;
  const attendanceRate = stats.total > 0 ? Math.round((presentEmployees / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-neutral-200 text-center">
        <p className="text-lg sm:text-xl font-bold text-neutral-900">{stats.total}</p>
        <p className="text-xs sm:text-sm text-neutral-600">Total</p>
      </div>
      
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-neutral-200 text-center">
        <p className="text-lg sm:text-xl font-bold text-success-600">{stats.complete}</p>
        <p className="text-xs sm:text-sm text-neutral-600">Complet</p>
      </div>
      
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-neutral-200 text-center">
        <p className="text-lg sm:text-xl font-bold text-warning-600">{stats.incomplete}</p>
        <p className="text-xs sm:text-sm text-neutral-600">Incomplet</p>
      </div>
      
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-neutral-200 text-center">
        <p className="text-lg sm:text-xl font-bold text-danger-600">{stats.absent}</p>
        <p className="text-xs sm:text-sm text-neutral-600">Absent</p>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-lg border border-neutral-200 text-center">
        <p className="text-lg sm:text-xl font-bold text-primary-600">{completionRate}%</p>
        <p className="text-xs sm:text-sm text-neutral-600">Finalizare</p>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-lg border border-neutral-200 text-center">
        <p className="text-lg sm:text-xl font-bold text-primary-600">{attendanceRate}%</p>
        <p className="text-xs sm:text-sm text-neutral-600">Prezență</p>
      </div>
    </div>
  );
}