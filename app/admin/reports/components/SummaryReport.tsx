import React from 'react';
import ReportTable from '../../../shared/components/ReportTable';
import type { DepartmentSummaryData } from '../../../lib/services/reportsService';

interface SummaryReportProps {
  data: DepartmentSummaryData[];
  selectedMonth: string;
}

export default function SummaryReport({ data, selectedMonth }: SummaryReportProps) {
  const formatSelectedDate = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

  const renderCell = (item: DepartmentSummaryData, key: string) => {
    switch (key) {
      case 'departament':
        return <span className="font-medium text-neutral-900">{item.name}</span>;
      case 'angajați':
        return <span className="text-neutral-600">{item.employees}</span>;
      case 'rata_prezență':
        return (
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
            item.attendance >= 90 ? 'bg-success-100 text-success-700' :
            item.attendance >= 80 ? 'bg-warning-100 text-warning-700' :
            'bg-danger-100 text-danger-700'
          }`}>
            {item.attendance}%
          </span>
        );
      case 'zile_concediu':
        return <span className="text-neutral-600">{item.leaves}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Statistici pe Departamente - {formatSelectedDate()}
      </h3>
      
      <ReportTable
        headers={['Departament', 'Angajați', 'Rata Prezență', 'Zile Concediu']}
        data={data}
        renderCell={renderCell}
        emptyMessage="Nu există date pentru perioada selectată."
      />
    </div>
  );
}