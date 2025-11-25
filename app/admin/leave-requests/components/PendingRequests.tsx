import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface PendingRequest {
  id: string; // ✅ Changed from number to string for UUID
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  submittedDate: string;
}

interface PendingRequestsProps {
  requests: PendingRequest[];
  onApprove: (id: string) => void; // ✅ Changed from number to string
  onReject: (id: string) => void; // ✅ Changed from number to string
}

export default function PendingRequests({ requests, onApprove, onReject }: PendingRequestsProps) {
  if (requests.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-success-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Nu există cereri în așteptare</h3>
          <p className="text-neutral-600">Toate cererile de concediu au fost procesate.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <h3 className="text-lg font-semibold text-neutral-900">Cereri în Așteptare</h3>
          </div>
          <span className="bg-warning-100 text-warning-700 px-2 py-1 rounded-full text-xs font-medium">
            {requests.length} cereri
          </span>
        </div>
      </div>

      <div className="divide-y divide-neutral-200">
        {requests.map((request) => (
          <div key={request.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-neutral-900">{request.employeeName}</h4>
                <p className="text-xs text-neutral-500">{request.department}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-warning-500" />
                <span className="text-xs text-warning-600">În așteptare</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
              <div>
                <p className="font-medium text-neutral-700">{request.leaveType}</p>
              </div>
              <div>
                <p className="text-neutral-600">
                  {new Date(request.startDate).toLocaleDateString('ro-RO')} - {new Date(request.endDate).toLocaleDateString('ro-RO')}
                </p>
              </div>
              <div>
                <p className="text-neutral-600">{request.days} zile</p>
              </div>
              <div>
                <p className="text-neutral-600">{new Date(request.submittedDate).toLocaleDateString('ro-RO')}</p>
              </div>
            </div>

            {request.reason && (
              <div className="mb-3">
                <p className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded text-italic">{request.reason}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => onApprove(request.id)}
                className="btn-success flex items-center gap-1 text-sm px-3 py-1"
              >
                <CheckCircle className="h-3 w-3" />
                Aprobă
              </button>
              <button
                onClick={() => onReject(request.id)}
                className="btn-danger flex items-center gap-1 text-sm px-3 py-1"
              >
                <XCircle className="h-3 w-3" />
                Respinge
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}