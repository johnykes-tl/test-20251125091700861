import { useState, useCallback } from 'react';

interface UseDateNavigationOptions {
  initialDate?: string;
  minDate?: string;
  maxDate?: string;
  onChange?: (date: string) => void;
}

export function useDateNavigation(options: UseDateNavigationOptions = {}) {
  const {
    initialDate = new Date().toISOString().split('T')[0],
    minDate,
    maxDate,
    onChange
  } = options;

  const [selectedDate, setSelectedDate] = useState(initialDate);

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const newDateString = currentDate.toISOString().split('T')[0];
    
    // Check bounds
    if (minDate && newDateString < minDate) return;
    if (maxDate && newDateString > maxDate) return;

    setSelectedDate(newDateString);
    if (onChange) {
      onChange(newDateString);
    }
  }, [selectedDate, minDate, maxDate, onChange]);

  const setDate = useCallback((date: string) => {
    // Check bounds
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    setSelectedDate(date);
    if (onChange) {
      onChange(date);
    }
  }, [minDate, maxDate, onChange]);

  const goToToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, [setDate]);

  const formatDate = useCallback((locale: string = 'ro-RO') => {
    const date = new Date(selectedDate);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    };
    return date.toLocaleDateString(locale, options);
  }, [selectedDate]);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const canNavigatePrev = !minDate || selectedDate > minDate;
  const canNavigateNext = !maxDate || selectedDate < maxDate;

  return {
    selectedDate,
    setDate,
    navigateDate,
    goToToday,
    formatDate,
    isToday,
    canNavigatePrev,
    canNavigateNext
  };
}