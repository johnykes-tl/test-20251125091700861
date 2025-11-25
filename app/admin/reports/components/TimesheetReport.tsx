import React from 'react';
import ReportTable from '../../../shared/components/ReportTable';
import type { TimesheetReportData } from '../../../lib/services/reportsService';

interface TimesheetReportProps {
  data: TimesheetReportData[];
  selectedMonth: string;
}

export default function TimesheetReport({ data, selectedMonth }: TimesheetReportProps) {
  const formatSelectedDate = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  };

  const renderCell = (item: TimesheetReportData, key: string) => {
    switch (key) {
      case 'angajat':
        return <span className="font-medium text-neutral-900">{item.angajat}</span>;
      case 'departament':
        return <span className="text-neutral-600">{item.departament}</span>;
      case 'status':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.status === 'Complet' ? 'bg-success-100 text-success-700' :
            item.status === 'Incomplet' ? 'bg-warning-100 text-warning-700' :
            'bg-danger-100 text-danger-700'
          }`}>
            {item.status}
          </span>
        );
      case 'ora':
        return <span className="text-neutral-600 text-sm">{item.ora_trimitere}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Raport Pontaj Zilnic - {formatSelectedDate()}
      </h3>
      
      <ReportTable
        headers={['Angajat', 'Departament', 'Status', 'Ora']}
        data={data}
        renderCell={renderCell}
        emptyMessage="Nu există date de pontaj pentru perioada selectată."
      />
    </div>
  );
}