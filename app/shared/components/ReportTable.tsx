import React from 'react';

interface ReportTableProps {
  headers: string[];
  data: any[];
  renderCell: (item: any, key: string, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function ReportTable({
  headers,
  data,
  renderCell,
  emptyMessage = "Nu există date pentru afișare",
  className = ""
}: ReportTableProps) {
  if (data.length === 0) {
    return (
      <div className={`card p-8 text-center ${className}`}>
        <p className="text-neutral-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              {headers.map((header, index) => (
                <th key={index} className="text-left py-3 px-4 font-medium text-neutral-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                {headers.map((header, headerIndex) => (
                  <td key={headerIndex} className="py-4 px-4">
                    {renderCell(item, header.toLowerCase().replace(/\s+/g, '_'), index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4 p-4">
        {data.map((item, index) => (
          <div key={index} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="space-y-2">
              {headers.map((header, headerIndex) => (
                <div key={headerIndex} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-600">{header}:</span>
                  <div className="text-sm">
                    {renderCell(item, header.toLowerCase().replace(/\s+/g, '_'), index)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}