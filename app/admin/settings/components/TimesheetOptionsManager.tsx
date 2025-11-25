import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Check, X, RefreshCw } from 'lucide-react';
import { FormField, TextareaField, CheckboxField } from '../../../shared/components/FormFields';

interface TimesheetOption {
  id: number;
  title: string;
  key: string;
  employee_text: string;
  display_order: number;
  active: boolean;
}

interface TimesheetOptionsManagerProps {
  options: TimesheetOption[];
  onOptionsChange: (options: TimesheetOption[]) => void;
  onCreateOption: (option: { title: string; key: string; employee_text: string }) => Promise<void>;
  onUpdateOption: (id: number, option: { title: string; key: string; employee_text: string }) => Promise<void>;
  onDeleteOption: (id: number) => Promise<void>;
  onToggleOption: (id: number) => Promise<void>;
  onReorderOption: (id: number, direction: 'up' | 'down') => Promise<void>;
  loading?: string | null;
}

export default function TimesheetOptionsManager({
  options,
  onOptionsChange,
  onCreateOption,
  onUpdateOption,
  onDeleteOption,
  onToggleOption,
  onReorderOption,
  loading = null
}: TimesheetOptionsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newOption, setNewOption] = useState({
    title: '',
    key: '',
    employee_text: ''
  });
  const [editingOption, setEditingOption] = useState<Partial<TimesheetOption>>({});

  const generateKey = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  };

  const handleAddOption = async () => {
    if (!newOption.title.trim() || !newOption.employee_text.trim()) {
      return;
    }

    try {
      await onCreateOption({
        title: newOption.title.trim(),
        key: newOption.key || generateKey(newOption.title),
        employee_text: newOption.employee_text.trim()
      });

      setNewOption({ title: '', key: '', employee_text: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating option:', error);
    }
  };

  const handleEditOption = async () => {
    if (!editingId || !editingOption.title?.trim() || !editingOption.employee_text?.trim()) {
      return;
    }

    try {
      await onUpdateOption(editingId, {
        title: editingOption.title.trim(),
        key: editingOption.key || generateKey(editingOption.title),
        employee_text: editingOption.employee_text.trim()
      });

      setEditingId(null);
      setEditingOption({});
    } catch (error) {
      console.error('Error updating option:', error);
    }
  };

  const sortedOptions = [...options].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      {/* Add New Option */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Adaugă Opțiune Pontaj</h2>
            <p className="text-sm text-neutral-600 mt-1">Creează noi opțiuni pentru pontajul angajaților</p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adaugă Opțiune
            </button>
          )}
        </div>

        {showAddForm && (
          <div className="bg-neutral-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Titlu Opțiune"
                id="title"
                value={newOption.title}
                onChange={(e) => setNewOption({
                  ...newOption,
                  title: e.target.value,
                  key: generateKey(e.target.value)
                })}
                placeholder="ex: Prezență, Update PR"
                required
              />
              
              <FormField
                label="Cheia Câmp"
                id="key"
                value={newOption.key}
                onChange={(e) => setNewOption({...newOption, key: e.target.value})}
                placeholder="ex: present, update_pr"
              />
            </div>
            
            <div className="mt-4">
              <TextareaField
                label="Text pentru Angajați"
                id="employee_text"
                value={newOption.employee_text}
                onChange={(e) => setNewOption({...newOption, employee_text: e.target.value})}
                placeholder="ex: Am fost prezent în această zi"
                rows={2}
                required
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddOption}
                disabled={loading === 'creating' || !newOption.title.trim() || !newOption.employee_text.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loading === 'creating' ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Adaugă Opțiunea
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewOption({ title: '', key: '', employee_text: '' });
                }}
                className="btn-secondary"
              >
                Anulează
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manage Options */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Gestionare Opțiuni</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {options.filter(opt => opt.active).length} din {options.length} opțiuni active
            </p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Ascunde Preview' : 'Arată Preview'}
          </button>
        </div>

        <div className="space-y-3">
          {sortedOptions.map((option, index) => (
            <div key={option.id} className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Order Controls */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded font-mono">
                    #{option.display_order}
                  </span>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onReorderOption(option.id, 'up')}
                      disabled={index === 0 || loading === 'reordering'}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onReorderOption(option.id, 'down')}
                      disabled={index === sortedOptions.length - 1 || loading === 'reordering'}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={option.active}
                    onChange={() => onToggleOption(option.id)}
                    disabled={loading === 'toggling'}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                </div>

                {/* Content */}
                {editingId === option.id ? (
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editingOption.title || ''}
                        onChange={(e) => setEditingOption({
                          ...editingOption,
                          title: e.target.value,
                          key: generateKey(e.target.value)
                        })}
                        className="px-3 py-2 border border-neutral-300 rounded text-sm"
                        placeholder="Titlu"
                      />
                      <input
                        type="text"
                        value={editingOption.key || ''}
                        onChange={(e) => setEditingOption({...editingOption, key: e.target.value})}
                        className="px-3 py-2 border border-neutral-300 rounded text-sm"
                        placeholder="Cheie"
                      />
                    </div>
                    <input
                      type="text"
                      value={editingOption.employee_text || ''}
                      onChange={(e) => setEditingOption({...editingOption, employee_text: e.target.value})}
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
                      placeholder="Text angajați"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditOption}
                        disabled={loading === 'updating'}
                        className="p-2 text-success-600 hover:bg-success-50 rounded"
                      >
                        {loading === 'updating' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingOption({});
                        }}
                        className="p-2 text-neutral-600 hover:bg-neutral-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${option.active ? 'text-neutral-900' : 'text-neutral-500'}`}>
                        {option.title}
                        {option.active && <span className="ml-2 text-xs bg-success-100 text-success-700 px-2 py-1 rounded-full">Activ</span>}
                      </h4>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(option.id);
                            setEditingOption(option);
                          }}
                          className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteOption(option.id)}
                          disabled={loading === 'deleting'}
                          className="p-2 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded"
                        >
                          {loading === 'deleting' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-600 space-y-1">
                      <p><span className="font-medium">Cheie:</span> <code className="bg-neutral-100 px-1 rounded">{option.key}</code></p>
                      <p><span className="font-medium">Text angajați:</span> {option.employee_text}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {sortedOptions.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <p>Nu există opțiuni de pontaj configurate.</p>
            <p className="text-sm">Adaugă prima opțiune folosind formularul de mai sus.</p>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {showPreview && sortedOptions.filter(opt => opt.active).length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Previzualizare Pontaj Angajat</h2>
          <div className="bg-neutral-50 p-6 rounded-lg">
            <h3 className="font-medium text-neutral-900 mb-4">Opțiunile vor apărea astfel pentru angajați:</h3>
            <div className="space-y-3">
              {sortedOptions.filter(opt => opt.active).map((option) => (
                <label key={option.id} className="flex items-center gap-3 p-3 bg-white rounded border hover:shadow-sm transition-shadow cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    disabled
                  />
                  <span className="text-sm text-neutral-700">{option.employee_text}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}