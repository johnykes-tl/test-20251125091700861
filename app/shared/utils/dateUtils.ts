export const formatDate = (dateString: string, locale: string = 'ro-RO'): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale);
};

export const formatDateTime = (dateString: string, locale: string = 'ro-RO'): string => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale)}`;
};

export const formatDateRange = (startDate: string, endDate: string, locale: string = 'ro-RO'): string => {
  const start = formatDate(startDate, locale);
  const end = formatDate(endDate, locale);
  return `${start} - ${end}`;
};

export const formatDateLong = (dateString: string, locale: string = 'ro-RO'): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  };
  return date.toLocaleDateString(locale, options);
};

export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const addDays = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const isWeekend = (dateString: string): boolean => {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};