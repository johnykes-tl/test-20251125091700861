import React from 'react';
import { Search, UserCheck, UserX, RefreshCw } from 'lucide-react';
import type { TimesheetOption } from '../../../lib/types/timesheet';

interface AdminTimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  timesheetData: Record<string, boolean>;
  submittedAt: string | null;
  status: 'complete' | 'incomplete' | 'absent';
  isActive: boolean;
  notes?: string;
}

interface TimesheetTableProps {
  data: AdminTimesheetEntry[];
  timesheetOptions: TimesheetOption[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeTab: 'active' | 'inactive';
  onTabChange: (tab: 'active' | 'inactive') => void;
  onToggleCheckbox: (entryId: string, optionKey: string) => void;
  saving?: string | null;
}

export default function TimesheetTable({ 
  data, 
  timesheetOptions,
  searchTerm, 
  onSearchChange, 
  activeTab, 
  onTabChange, 
  onToggleCheckbox,
  saving = null
}: TimesheetTableProps) {
  const filteredData = data.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'active' ? entry.isActive : !entry.isActive;
    return matchesSearch && matchesTab;
  });

  const activeCount = data.filter(e => e.isActive).length;
  const inactiveCount = data.filter(e => !e.isActive).length;

  const CheckboxButton = ({ 
    checked, 
    onClick, 
    disabled = false 
  }: { 
    checked: boolean; 
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto rounded border-2 flex items-center justify-center transition-colors hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked 
          ? 'bg-success-600 border-success-600 hover:bg-success-700' 
          : 'border-neutral-300 hover:border-success-400'
      }`}
    >
      {checked && (
        <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  if (timesheetOptions.length === 0) {
    return (
      <div className="card p-8">
        <div className="text-center">
          <div className="text-neutral-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Nu există opțiuni de pontaj</h3>
          <p className="text-neutral-600">
            Configurează opțiunile de pontaj din secțiunea Configurare pentru a putea înregistra pontajul angajaților.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="p-4 border-b border-neutral-200">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Caută angajați..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="border-b border-neutral-200">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => onTabChange('active')}
            className={`px-4 sm:px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'active'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Angajați Activi</span>
              <span className="sm:hidden">Activi</span>
              ({activeCount})
            </div>
          </button>
          <button
            onClick={() => onTabChange('inactive')}
            className={`px-4 sm:px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'inactive'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <UserX className="h-4 w-4" />
              <span className="hidden sm:inline">Angajați Demisi</span>
              <span className="sm:hidden">Demisi</span>
              ({inactiveCount})
            </div>
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-neutral-700 text-sm">ANGAJAT</th>
              {timesheetOptions.map(option => (
                <th key={option.key} className="text-center py-3 px-4 font-medium text-neutral-700 text-sm uppercase">
                  {option.title}
                </th>
              ))}
              <th className="text-center py-3 px-4 font-medium text-neutral-700 text-sm">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr key={entry.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {saving === entry.id && (
                      <RefreshCw className="h-3 w-3 animate-spin text-primary-600" />
                    )}
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">{entry.employeeName}</p>
                      <p className="text-xs text-neutral-500">{entry.department}</p>
                    </div>
                  </div>
                </td>
                {timesheetOptions.map(option => (
                  <td key={option.key} className="py-3 px-4 text-center">
                    <CheckboxButton 
                      checked={entry.timesheetData[option.key] || false}
                      onClick={() => onToggleCheckbox(entry.id, option.key)}
                      disabled={saving === entry.id}
                    />
                  </td>
                ))}
                <td className="py-3 px-4 text-center">
                  <span className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${
                    entry.status === 'complete' ? 'bg-success-100 text-success-700' :
                    entry.status === 'incomplete' ? 'bg-warning-100 text-warning-700' :
                    'bg-danger-100 text-danger-700'
                  }`}>
                    {entry.status === 'complete' ? 'Complet' :
                     entry.status === 'incomplete' ? 'Incomplet' : 'Absent'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3 p-4">
        {filteredData.map((entry) => (
          <div key={entry.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {saving === entry.id && (
                  <RefreshCw className="h-3 w-3 animate-spin text-primary-600" />
                )}
                <div>
                  <h3 className="font-medium text-neutral-900 text-sm">{entry.employeeName}</h3>
                  <p className="text-xs text-neutral-500">{entry.department}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                entry.status === 'complete' ? 'bg-success-100 text-success-700' :
                entry.status === 'incomplete' ? 'bg-warning-100 text-warning-700' :
                'bg-danger-100 text-danger-700'
              }`}>
                {entry.status === 'complete' ? 'C' :
                 entry.status === 'incomplete' ? 'I' : 'A'}
              </span>
            </div>
            
            <div className={`grid gap-4 ${timesheetOptions.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {timesheetOptions.map(option => (
                <div key={option.key} className="text-center">
                  <p className="text-xs text-neutral-500 mb-2">{option.title}</p>
                  <CheckboxButton 
                    checked={entry.timesheetData[option.key] || false}
                    onClick={() => onToggleCheckbox(entry.id, option.key)}
                    disabled={saving === entry.id}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-neutral-500">Nu au fost găsite înregistrări pentru criteriile selectate.</p>
          {searchTerm && (
            <button 
              onClick={() => onSearchChange('')}
              className="text-primary-600 hover:text-primary-700 text-sm mt-2"
            >
              Șterge căutarea
            </button>
          )}
        </div>
      )}
    </div>
  );
}