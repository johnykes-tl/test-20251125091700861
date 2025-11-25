import React from 'react';
import ReportTable from '../../../shared/components/ReportTable';
import type { LeaveReportData } from '../../../lib/services/reportsService';

interface LeaveReportProps {
  data: LeaveReportData[];
  selectedMonth: string;
}

export default function LeaveReport({ data, selectedMonth }: LeaveReportProps) {
  const renderCell = (item: LeaveReportData, key: string) => {
    switch (key) {
      case 'angajat':
        return <span className="font-medium text-neutral-900">{item.employee}</span>;
      case 'departament':
        return <span className="text-neutral-600">{item.department}</span>;
      case 'total':
        return <span className="text-neutral-600">{item.totalDays}</span>;
      case 'folosite':
        return <span className="text-warning-600 font-medium">{item.usedDays}</span>;
      case 'ramase':
        return <span className="text-success-600 font-medium">{item.remainingDays}</span>;
      case 'pendente':
        return item.pendingDays > 0 ? (
          <span className="px-2 py-1 bg-warning-100 text-warning-700 rounded-full text-sm font-medium">
            {item.pendingDays}
          </span>
        ) : (
          <span className="text-neutral-500">-</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Raport Concedii Detailat - Anul {selectedMonth.split('-')[0]}
      </h3>
      
      <ReportTable
        headers={['Angajat', 'Departament', 'Total', 'Folosite', 'Ramase', 'Pendente']}
        data={data}
        renderCell={renderCell}
        emptyMessage="Nu există date de concedii pentru anul selectat."
      />
    </div>
  );
}