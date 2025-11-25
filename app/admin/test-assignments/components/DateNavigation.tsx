'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateNavigationProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function DateNavigation({ selectedDate, onDateChange, onNavigate }: DateNavigationProps) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;
  
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

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO');
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('prev')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-600" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-900 capitalize mb-1">
              {formatDate(selectedDate)}
              {isToday && (
                <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  Astăzi
                </span>
              )}
            </h2>
            <p className="text-sm text-neutral-500">
              {isToday ? 'Poți edita assignările' : 'Doar vizualizare (zi trecută)'}
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('next')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-neutral-600" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          
          {!isToday && (
            <button
              onClick={() => onDateChange(today)}
              className="btn-primary text-sm"
            >
              Mergi la Astăzi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}