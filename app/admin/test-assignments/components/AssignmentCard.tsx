'use client';

import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  Trash2,
  Plus,
  RefreshCw,
  Save,
  X,
  Edit
} from 'lucide-react';
import type { TestAssignmentWithDetails } from '../../../lib/types/tests'; // Corrected path
import type { EligibleEmployee } from '../../../lib/services/testAssignmentsService';

interface AssignmentCardProps {
  testId: string;
  testTitle: string;
  testDescription: string;
  assignments: TestAssignmentWithDetails[];
  isToday: boolean;
  eligibleEmployees: EligibleEmployee[];
  onAddAssignment: (testId: string, employeeId: string) => void;
  onRemoveAssignment: (assignmentId: string) => void;
 onUpdateAssignment: (assignmentId: string, newEmployeeId: string) => void;
  onUpdateStatus: (assignmentId: string, status: 'pending' | 'completed' | 'skipped') => Promise<void>;
  loading?: string | null;
}

export default function AssignmentCard({
  testId,
  testTitle,
  testDescription,
  assignments,
  isToday,
  eligibleEmployees,
  onAddAssignment,
  onRemoveAssignment,
  onUpdateAssignment,
  onUpdateStatus,
  loading = null
}: AssignmentCardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
 const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
 const [newEmployeeForEdit, setNewEmployeeForEdit] = useState('');

 const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
         return 'bg-success-100 text-success-700 border-success-200';
     case 'pending':
         return 'bg-warning-100 text-warning-700 border-warning-200';
     case 'skipped':
         return 'bg-neutral-100 text-neutral-700 border-neutral-200';
     default:
         return 'bg-neutral-100 text-neutral-700 border-neutral-200';
   }
  };

  // Filter out employees who already have this test assigned
  const assignedEmployeeIds = new Set(assignments.map(a => a.employee_id));
  const availableEmployees = eligibleEmployees.filter(emp => !assignedEmployeeIds.has(emp.id));

  const handleAddAssignment = () => {
    if (selectedEmployeeId) {
      onAddAssignment(testId, selectedEmployeeId);
      setSelectedEmployeeId('');
      setShowAddForm(false);
    }
  };

 const handleStartEdit = (assignment: TestAssignmentWithDetails) => {
   setEditingAssignmentId(assignment.id);
   setNewEmployeeForEdit(assignment.employee_id);
   setShowAddForm(false); // Close add form if open
 };

 const handleCancelEdit = () => {
   setEditingAssignmentId(null);
   setNewEmployeeForEdit('');
 };

 const handleSaveEdit = () => {
   if (editingAssignmentId && newEmployeeForEdit) {
     onUpdateAssignment(editingAssignmentId, newEmployeeForEdit);
     handleCancelEdit(); // Exit edit mode after saving
   }
 };

  return (
    <div className="card border-l-4 border-l-primary-500">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">{testTitle}</h3>
            <p className="text-sm text-neutral-600 mb-3">{testDescription}</p>
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {assignments.length} assignați
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Test ID: {testId.slice(0, 8)}...
              </span>
            </div>
          </div>
          
          {isToday && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                disabled={availableEmployees.length === 0 || loading !== null}
                className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Adaugă
              </button>
            </div>
          )}
        </div>

        {/* Add Assignment Form (Today Only) */}
        {isToday && showAddForm && (
          <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <h4 className="font-medium text-primary-900 mb-3">Adaugă Angajat la Test</h4>
            {availableEmployees.length === 0 ? (
              <p className="text-sm text-primary-700">Toți angajații eligibili au fost deja assignați la acest test.</p>
            ) : (
              <div className="flex gap-3">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  disabled={loading !== null}
                >
                  <option value="">Selectează angajatul...</option>
                  {availableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.department}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddAssignment}
                  disabled={!selectedEmployeeId || loading !== null}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {loading === `add-${testId}` ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                      Se adaugă...
                    </>
                  ) : (
                    'Adaugă'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedEmployeeId('');
                  }}
                  className="btn-secondary text-sm"
                  disabled={loading !== null}
                >
                  Anulează
                </button>
              </div>
            )}
          </div>
        )}

        {/* Assignments List */}
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="text-center py-6 text-neutral-500">
              <User className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">Nu sunt assignați angajați la acest test</p>
              {isToday && (
                <p className="text-xs mt-1">Folosește butonul "Adaugă" pentru a assigma angajați</p>
              )}
            </div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                {editingAssignmentId === assignment.id ? (
                  // EDITING VIEW
                  <div className="flex items-center gap-3">
                    <select
                      value={newEmployeeForEdit}
                      onChange={(e) => setNewEmployeeForEdit(e.target.value)}
                      className="flex-1 px-3 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                      disabled={loading !== null}
                  >
                      {(() => {
                        const currentEmployee = eligibleEmployees.find(e => e.id === assignment.employee_id);
                        const dropdownOptions = [...availableEmployees];
                        if (currentEmployee && !availableEmployees.some(e => e.id === currentEmployee.id)) {
                          dropdownOptions.push(currentEmployee);
                        }
                        dropdownOptions.sort((a, b) => a.name.localeCompare(b.name));
                        
                        return dropdownOptions.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} - {emp.department}
                          </option>
                        ));
                      })()}
                    </select>
                    <button
                      onClick={handleSaveEdit}
                      disabled={loading !== null || !newEmployeeForEdit || newEmployeeForEdit === assignment.employee_id}
                      className="p-2 text-success-600 hover:bg-success-50 rounded disabled:opacity-50"
                      title="Salvează modificarea"
                    >
                      {loading === `update-${assignment.id}` ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={loading !== null}
                      className="p-2 text-neutral-600 hover:bg-neutral-100 rounded disabled:opacity-50"
                      title="Anulează"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  // NORMAL VIEW
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-neutral-900 text-sm">{assignment.employee_name}</p>
                        {isToday && (
                          <button onClick={() => handleStartEdit(assignment)} disabled={loading !== null} className="p-1 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors disabled:opacity-50" title="Editează angajatul">
                            <Edit className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span>{assignment.employee_department}</span>
                          <span>Termen: {new Date(assignment.due_date).toLocaleDateString('ro-RO')}</span>
                          {assignment.completed_at && (
                            <span>Finalizat: {new Date(assignment.completed_at).toLocaleDateString('ro-RO')}</span>
                          )}
                        </div>
                        {assignment.notes && (
                          <p className="text-xs text-neutral-600 mt-1 italic">"{assignment.notes}"</p>
                        )}
                      </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="relative gap-2">
                          <select
                            value={assignment.status || 'pending'}
                            onChange={(e) => onUpdateStatus(assignment.id, e.target.value as any)}
                            disabled={loading === `status-${assignment.id}`}
                            className={`pl-2 pr-6 py-1 rounded-full text-xs font-medium border appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(assignment.status)}`}
                          >
                            <option value="pending">În Așteptare</option>
                            <option value="completed">Finalizat</option>
                            <option value="skipped">Omis</option>
                          </select>
                          <Edit className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500 pointer-events-none" />
                        </div>
                        {loading === `status-${assignment.id}` && (
                          <RefreshCw className="h-3 w-3 animate-spin text-primary-600" />
                        )}
                      </div>
                      {isToday && (
                        <button onClick={() => onRemoveAssignment(assignment.id)} disabled={loading === assignment.id} className="p-2 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors disabled:opacity-50" title="Elimină assignarea">
                          {loading === assignment.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
               )}
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>
              Total assignări: <strong>{assignments.length}</strong>
            </span>
            <div className="flex items-center gap-4">
              <span>
                Finalizate: <strong className="text-success-600">{assignments.filter(a => a.status === 'completed').length}</strong>
              </span>
              <span>
                În așteptare: <strong className="text-warning-600">{assignments.filter(a => a.status === 'pending').length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}