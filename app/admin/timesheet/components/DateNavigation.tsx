import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateNavigationProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function DateNavigation({ selectedDate, onDateChange, onNavigate }: DateNavigationProps) {
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

  return (
    <div className="bg-neutral-50 p-4 rounded-lg mb-6">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onNavigate('prev')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-neutral-600" />
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold text-neutral-900 capitalize">
            {formatDate(selectedDate)}
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="mt-1 px-3 py-1 text-sm border border-neutral-200 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => onNavigate('next')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-neutral-600" />
        </button>
      </div>
    </div>
  );
}