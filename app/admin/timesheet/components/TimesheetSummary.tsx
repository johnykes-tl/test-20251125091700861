import React from 'react';
import type { TimesheetStats } from '../../../lib/types/timesheet';

interface TimesheetSummaryProps {
  selectedDate: string;
  stats: TimesheetStats;
}

export default function TimesheetSummary({ selectedDate, stats }: TimesheetSummaryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    };
    return date.toLocaleDateString('ro-RO', options);
  };

  const completionRate = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;
  const attendanceRate = stats.total > 0 ? Math.round(((stats.complete + stats.incomplete) / stats.total) * 100) : 0;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-neutral-700 mb-4">Sumar pentru {formatDate(selectedDate)}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-success-50 p-4 rounded-lg border border-success-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success-600 font-medium">Pontaje Complete</p>
              <p className="text-2xl font-bold text-success-700">{stats.complete}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-success-600">din {stats.total} angajați</p>
              <p className="text-sm font-semibold text-success-700">{completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-warning-50 p-4 rounded-lg border border-warning-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning-600 font-medium">Pontaje Incomplete</p>
              <p className="text-2xl font-bold text-warning-700">{stats.incomplete}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-warning-600">necesită completare</p>
              <p className="text-sm font-semibold text-warning-700">
                {stats.total > 0 ? Math.round((stats.incomplete / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-danger-50 p-4 rounded-lg border border-danger-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-danger-600 font-medium">Angajați Absenți</p>
              <p className="text-2xl font-bold text-danger-700">{stats.absent}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-danger-600">fără pontaj</p>
              <p className="text-sm font-semibold text-danger-700">
                {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 font-medium">Rata Generală</p>
              <p className="text-2xl font-bold text-primary-700">{attendanceRate}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-primary-600">prezență totală</p>
              <p className="text-sm font-semibold text-primary-700">
                {stats.complete + stats.incomplete}/{stats.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {stats.total === 0 && (
        <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
          <p className="text-neutral-500">Nu există angajați în această categorie.</p>
        </div>
      )}
    </div>
  );
}