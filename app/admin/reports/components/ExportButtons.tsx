'use client';

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF, getFormattedFilename } from '../utils/exportUtils';

interface ExportButtonsProps {
  data: any[];
  reportType: 'attendance' | 'leave' | 'summary' | 'timesheet';
  selectedMonth: string;
}

export default function ExportButtons({ data, reportType, selectedMonth }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (data.length === 0) {
      alert('Nu există date pentru export');
      return;
    }

    setIsExporting(true);
    setShowDropdown(false);

    try {
      const filename = getFormattedFilename(reportType, selectedMonth);
      
      switch (format) {
        case 'csv':
          exportToCSV(data, filename, reportType);
          break;
        case 'excel':
          exportToExcel(data, filename, reportType);
          break;
        case 'pdf':
          exportToPDF(data, filename, reportType, selectedMonth);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Eroare la exportul datelor');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting || data.length === 0}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Se exportă...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export Raport
          </>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-20">
            <div className="py-2">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
              >
                <FileText className="h-4 w-4 text-green-600" />
                Export CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Export Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
              >
                <File className="h-4 w-4 text-red-600" />
                Export PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}