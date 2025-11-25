'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { ro } from 'date-fns/locale';

interface LeaveEntry {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  status: 'approved' | 'pending' | 'rejected';
  leaveType: string;
}

interface LeaveCalendarProps {
  leaves: LeaveEntry[];
  currentMonth: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
}

export default function LeaveCalendar({ leaves, currentMonth, onMonthChange }: LeaveCalendarProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekdays = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-500';
      case 'rejected':
        return 'bg-danger-500';
      case 'pending':
        return 'bg-warning-500';
      default:
        return 'bg-neutral-500';
    }
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ro })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange('prev')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          <button
            onClick={() => onMonthChange('next')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-neutral-600" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-neutral-600 mb-2">
          {weekdays.map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            const leavesOnDay = leaves.filter(leave => 
              isWithinInterval(day, {
                start: parseISO(leave.startDate),
                end: parseISO(leave.endDate)
              }) && leave.status === 'approved'
            );

            return (
              <div
                key={day.toString()}
                className={`
                  h-32 border border-neutral-200 rounded-lg p-2 flex flex-col
                  ${isCurrentMonth ? 'bg-white' : 'bg-neutral-50 text-neutral-400'}
                  ${isToday ? 'border-2 border-primary-500' : ''}
                `}
              >
                <div className={`font-semibold ${isToday ? 'text-primary-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="mt-1 space-y-1 overflow-y-auto">
                  {leavesOnDay.map(leave => (
                    <div 
                      key={leave.id}
                      className={`
                        p-1 rounded text-white text-xs truncate
                        ${getStatusColor(leave.status)}
                      `}
                      title={`${leave.employeeName} - ${leave.leaveType}`}
                    >
                      {leave.employeeName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}