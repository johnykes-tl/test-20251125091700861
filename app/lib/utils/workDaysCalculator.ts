export function calculateWorkDays(startDateStr: string, endDateStr: string): number {
  let count = 0;
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Ensure start date is not after end date
  if (startDate > endDate) {
    return 0;
  }

  const curDate = new Date(startDate.getTime());

  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

// Enhanced validation with business rules
export const validateWorkDaysPeriod = (startDate: string, endDate: string): {
  isValid: boolean;
  workDays: number;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Basic date validation
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    errors.push('Datele introduse nu sunt valide');
    return { isValid: false, workDays: 0, errors, warnings };
  }
  
  if (end < start) {
    errors.push('Data de sfârșit trebuie să fie după data de început');
    return { isValid: false, workDays: 0, errors, warnings };
  }
  
  const workDays = calculateWorkDays(startDate, endDate);
  
  // Work days validation
  if (workDays === 0) {
    errors.push('Perioada selectată nu conține zile lucrătoare (luni-vineri)');
  }
  
  if (workDays > 30) {
    errors.push('Perioada nu poate depăși 30 de zile lucrătoare');
  }
  
  // Warnings for unusual patterns
  if (workDays === 1) {
    warnings.push('Cererea este pentru o singură zi lucrătoare');
  }
  
  if (workDays > 15) {
    warnings.push('Perioada lungă de concediu - verifică planificarea echipei');
  }
  
  // Check if period spans multiple months
  if (start.getMonth() !== end.getMonth()) {
    warnings.push('Concediul se întinde pe mai multe luni');
  }
  
  // Check for Friday-Monday pattern
  const startDay = start.getDay();
  const endDay = end.getDay();
  if ((startDay === 1 || endDay === 5) && workDays <= 3) {
    warnings.push('Pattern vineri-luni detectat');
  }
  
  return {
    isValid: errors.length === 0,
    workDays,
    errors,
    warnings
  };
};
export function formatWorkDaysRange(startDate: string, endDate: string): string {
    const workDays = calculateWorkDays(startDate, endDate);
    return `${workDays} ${workDays === 1 ? 'zi lucrătoare' : 'zile lucrătoare'}`;
}