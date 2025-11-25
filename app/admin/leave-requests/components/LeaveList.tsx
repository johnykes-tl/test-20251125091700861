import React from 'react';
import { Calendar, User, Clock, Edit } from 'lucide-react';

interface LeaveEntry {
  id: string; // ✅ Changed from number to string for UUID
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string;
  days: number;
  leaveType: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedDate: string;
}

interface LeaveListProps {
  leaves: LeaveEntry[];
  filterStatus: 'all' | 'approved' | 'pending' | 'rejected';
  onFilterChange: (status: 'all' | 'approved' | 'pending' | 'rejected') => void;
  onEditLeave?: (leave: LeaveEntry) => void;
}

export default function LeaveList({ leaves, filterStatus, onFilterChange, onEditLeave }: LeaveListProps) {
  const filteredLeaves = leaves.filter(leave => 
    filterStatus === 'all' || leave.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-100 text-success-700';
      case 'rejected':
        return 'bg-danger-100 text-danger-700';
      case 'pending':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobat';
      case 'rejected':
        return 'Respins';
      case 'pending':
        return 'În așteptare';
      default:
        return 'Necunoscut';
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('ro-RO');
    const end = new Date(endDate).toLocaleDateString('ro-RO');
    return `${start} - ${end}`;
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Lista Toate Concediile</h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Toate
            </button>
            <button
              onClick={() => onFilterChange('approved')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'approved'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Aprobate
            </button>
            <button
              onClick={() => onFilterChange('pending')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-warning-100 text-warning-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              În așteptare
            </button>
            <button
              onClick={() => onFilterChange('rejected')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'rejected'
                  ? 'bg-danger-100 text-danger-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Respinse
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-neutral-200">
        {filteredLeaves.map((leave) => (
          <div key={leave.id} className="p-6 hover:bg-neutral-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-neutral-400" />
                <div>
                  <h4 className="font-semibold text-neutral-900">{leave.employeeName}</h4>
                  <p className="text-sm text-neutral-600">{leave.department}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(leave.status)}`}>
                {getStatusText(leave.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-700">Perioada</p>
                  <p className="text-sm text-neutral-600">{formatDateRange(leave.startDate, leave.endDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-700">Durata</p>
                  <p className="text-sm text-neutral-600">{leave.days} zile</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-700">Tip concediu</p>
                <p className="text-sm text-neutral-600">{leave.leaveType}</p>
              </div>
            </div>

            <div className="text-xs text-neutral-500">
              Cerere trimisă la: {new Date(leave.submittedDate).toLocaleDateString('ro-RO')}
            </div>

            {onEditLeave && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <button
                  onClick={() => onEditLeave(leave)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Editează
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredLeaves.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-neutral-500">Nu au fost găsite concedii pentru filtrul selectat.</p>
        </div>
      )}
    </div>
  );
}