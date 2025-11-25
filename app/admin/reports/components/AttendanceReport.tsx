import React from 'react';
import ReportTable from '../../../shared/components/ReportTable';
import type { AttendanceReportData } from '../../../lib/services/reportsService';

interface AttendanceReportProps {
  data: AttendanceReportData[];
  selectedMonth: string;
}

export default function AttendanceReport({ data, selectedMonth }: AttendanceReportProps) {
  const formatSelectedDate = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

  const renderCell = (item: AttendanceReportData, key: string) => {
    switch (key) {
      case 'angajat':
        return <span className="font-medium text-neutral-900">{item.employee}</span>;
      case 'departament':
        return <span className="text-neutral-600">{item.department}</span>;
      case 'zile_lucru':
        return <span className="text-neutral-600">{item.workDays}</span>;
      case 'prezent':
        return <span className="text-success-600 font-medium">{item.presentDays}</span>;
      case 'absent':
        return <span className="text-danger-600 font-medium">{item.absences}</span>;
      case 'rata':
        return (
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
            item.rate >= 90 ? 'bg-success-100 text-success-700' :
            item.rate >= 80 ? 'bg-warning-100 text-warning-700' :
            'bg-danger-100 text-danger-700'
          }`}>
            {item.rate}%
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Raport Prezență Detailat - {formatSelectedDate()}
      </h3>
      
      <ReportTable
        headers={['Angajat', 'Departament', 'Zile Lucru', 'Prezent', 'Absent', 'Rata']}
        data={data}
        renderCell={renderCell}
        emptyMessage="Nu există date de prezență pentru perioada selectată."
      />
    </div>
  );
}