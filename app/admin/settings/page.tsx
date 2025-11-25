'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Settings,
  Shield,
  RefreshCw,
  AlertCircle,
  Database,
  Clock,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  X,
  Save
} from 'lucide-react';
import TimesheetOptionsManager from './components/TimesheetOptionsManager';
import SystemSettingsForm from './components/SystemSettingsForm';
import { settingsApi } from '../../lib/api/settingsApi';
import type { TimesheetOption, SystemSetting } from '../../lib/services/simpleSettingsService';
// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<'timesheet' | 'system' | 'security'>('timesheet');
  
  // Simple state management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  // Data states
  const [timesheetOptions, setTimesheetOptions] = useState<TimesheetOption[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);

  // System settings form data
  const [settingsForm, setSettingsForm] = useState({
    pontaj_cutoff_time: '22:00',
    allow_weekend_pontaj: 'false',
    require_daily_notes: 'false',
    max_leave_days_per_year: '25',
    email_notifications: 'true'
  });

  // State for managing the new option form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOption, setNewOption] = useState({ title: '', key: '', employee_text: '' });

  // State for managing editing existing options
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState<Partial<TimesheetOption>>({});

  // State for previewing timesheet options
  const [showPreview, setShowPreview] = useState(false);

  // Helper to generate a URL-friendly key from a title
  const generateKey = (title: string): string => {
    return title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Loading all settings data...');

      // Test connection first
      const connectionTest = await settingsApi.testConnection();
      setConnectionStatus(connectionTest.success ? 'connected' : 'failed');
      
      if (!connectionTest.success) {
        setError(connectionTest.message);
        return;
      }

      // Load all settings
      const data = await settingsApi.loadAllSettings();
      
      // If no data exists, initialize defaults
      if (data.timesheetOptions.length === 0 || data.systemSettings.length === 0) {
        console.log('🔄 No data found, initializing defaults...');
        await settingsApi.initializeDefaults();
        
        // Reload after initialization
        const newData = await settingsApi.loadAllSettings();
        setTimesheetOptions(newData.timesheetOptions);
        setSystemSettings(newData.systemSettings);
      } else {
        setTimesheetOptions(data.timesheetOptions);
        setSystemSettings(data.systemSettings);
      }

      // Convert system settings to form data
      const settingsMap = new Map(data.systemSettings.map(s => [s.key, s.value]));
      setSettingsForm({
        pontaj_cutoff_time: (settingsMap.get('pontaj_cutoff_time') as string) || '22:00',
        allow_weekend_pontaj: (settingsMap.get('allow_weekend_pontaj') as string) || 'false',
        require_daily_notes: (settingsMap.get('require_daily_notes') as string) || 'false',
        max_leave_days_per_year: (settingsMap.get('max_leave_days_per_year') as string) || '25',
        email_notifications: (settingsMap.get('email_notifications') as string) || 'true'
      });

      setSuccess('All settings loaded successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      setError(error.message);
      setConnectionStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setSaving('testing');
    setError(null);

    try {
      const result = await settingsApi.testConnection();
      setConnectionStatus(result.success ? 'connected' : 'failed');
      
      if (result.success) {
        setSuccess(`Connection successful! Response time: ${result.responseTime}ms`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setConnectionStatus('failed');
      setError(`Connection test failed: ${error.message}`);
    } finally {
      setSaving(null);
    }
  };

  // Timesheet Options Handlers
  const handleCreateOption = async (optionData: { title: string; key: string; employee_text: string }) => {
    setSaving('creating');
    setError(null);

    try {
      const created = await settingsApi.createTimesheetOption(optionData);
      setTimesheetOptions(prev => [...prev, created]);
      setSuccess('Timesheet option created successfully');
      setTimeout(() => setSuccess(null), 3000);
      setShowAddForm(false); // Close form after successful creation
      setNewOption({ title: '', key: '', employee_text: '' }); // Reset form
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateOption = async (id: number, optionData: { title: string; key: string; employee_text: string }) => {
    setSaving('updating');
    setError(null);

    try {
      const updated = await settingsApi.updateTimesheetOption(id, optionData);
      setTimesheetOptions(prev => prev.map(opt => opt.id === id ? updated : opt));
      setSuccess('Timesheet option updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      setEditingId(null); // Exit editing mode
      setEditingOption({}); // Clear editing state
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteOption = async (id: number) => {
    const option = timesheetOptions.find(opt => opt.id === id);
    if (!option || !confirm(`Delete "${option.title}"? This cannot be undone.`)) {
      return;
    }

    setSaving('deleting');
    setError(null);

    try {
      await settingsApi.deleteTimesheetOption(id);
      setTimesheetOptions(prev => prev.filter(opt => opt.id !== id));
      setSuccess('Timesheet option deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleOption = async (id: number) => {
    setSaving('toggling');
    setError(null);

    try {
      const updated = await settingsApi.toggleTimesheetOption(id);
      setTimesheetOptions(prev => prev.map(opt => opt.id === id ? updated : opt));
      setSuccess('Timesheet option status updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleReorderOption = async (id: number, direction: 'up' | 'down') => {
    setSaving('reordering');
    setError(null);

    try {
      await settingsApi.reorderTimesheetOptions(id, direction);
      // Reloading all settings to reflect the new order
      const data = await settingsApi.loadAllSettings();
      setTimesheetOptions(data.timesheetOptions);
      setSuccess('Timesheet options reordered');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(null);
    }
  };

  // Handler for editing an option
  const handleEditOption = () => {
    if (editingId !== null && editingOption.title && editingOption.key && editingOption.employee_text) {
      handleUpdateOption(editingId, {
        title: editingOption.title,
        key: editingOption.key,
        employee_text: editingOption.employee_text
      });
    } else {
      setError('Please fill in all fields for editing.');
    }
  };

  // System Settings Functions
  const handleSettingChange = (key: string, value: string) => {
    setSettingsForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving('settings');
    setError(null);

    try {
      const settingsToUpdate = Object.entries(settingsForm).map(([key, value]) => ({
        key,
        value
      }));

      await settingsApi.updateSystemSettings(settingsToUpdate);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(null);
    }
  };

  // Prepare sorted options for display
  const sortedOptions = [...timesheetOptions].sort((a, b) => a.display_order - b.display_order);

  // Navigation sections
  const sections = [
    { id: 'timesheet', label: 'Opțiuni Pontaj', icon: Clock },
    { id: 'system', label: 'Sistem General', icon: Settings },
    { id: 'security', label: 'Securitate', icon: Shield }
  ];

  // Loading state
  if (loading) {
    return (
      <DashboardLayout userRole="admin" pendingLeaveRequests={0}>
        <div className="p-8 flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-neutral-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin" pendingLeaveRequests={0}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Configurare Sistem
              </h1>
              <p className="text-neutral-600">
                Gestionează opțiunile de pontaj și setările sistemului
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={testConnection}
                disabled={saving === 'testing'}
                className="btn-secondary flex items-center gap-2"
              >
                {saving === 'testing' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                Test Connection
              </button>
              <button 
                onClick={loadAllData}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mb-4 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <>
                  <Check className="h-5 w-5 text-success-600" />
                  <span className="text-success-700 font-medium">Database Connected</span>
                </>
              )}
              {connectionStatus === 'failed' && (
                <>
                  <X className="h-5 w-5 text-danger-600" />
                  <span className="text-danger-700 font-medium">Database Connection Failed</span>
                </>
              )}
              {connectionStatus === 'unknown' && (
                <>
                  <AlertCircle className="h-5 w-5 text-warning-600" />
                  <span className="text-warning-700 font-medium">Connection Status Unknown</span>
                </>
              )}
            </div>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-3">
              <Check className="h-5 w-5 text-success-600 flex-shrink-0" />
              <p className="text-sm text-success-700">{success}</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-danger-600 hover:text-danger-700"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-neutral-200">
            <nav className="flex">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeSection === section.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Timesheet Options Section */}
        {activeSection === 'timesheet' && (
          <div className="space-y-8">
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
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Titlu Opțiune *
                      </label>
                      <input
                        type="text"
                        value={newOption.title}
                        onChange={(e) => setNewOption({
                          ...newOption,
                          title: e.target.value,
                          key: generateKey(e.target.value) // Auto-generate key
                        })}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="ex: Prezență, Update PR"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Cheia Câmp *
                      </label>
                      <input
                        type="text"
                        value={newOption.key}
                        onChange={(e) => setNewOption({...newOption, key: e.target.value})}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="ex: present, update_pr"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Text pentru Angajați *
                      </label>
                      <input
                        type="text"
                        value={newOption.employee_text}
                        onChange={(e) => setNewOption({...newOption, employee_text: e.target.value})}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="ex: Am fost prezent în această zi"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleCreateOption(newOption)}
                      disabled={saving === 'creating' || !newOption.title || !newOption.key || !newOption.employee_text}
                      className="btn-primary flex items-center gap-2"
                    >
                      {saving === 'creating' ? (
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
                        setNewOption({ title: '', key: '', employee_text: '' }); // Reset form
                      }}
                      className="btn-secondary"
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manage Existing Options */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Gestionare Opțiuni</h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    {timesheetOptions.filter(opt => opt.active).length} din {timesheetOptions.length} opțiuni active
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
                  <div key={option.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-4">
                      {/* Order Controls */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded font-mono">
                          #{option.display_order}
                        </span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReorderOption(option.id, 'up')}
                            disabled={index === 0 || saving === 'reordering'}
                            className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleReorderOption(option.id, 'down')}
                            disabled={index === sortedOptions.length - 1 || saving === 'reordering'}
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
                          onChange={() => handleToggleOption(option.id)}
                          disabled={saving === 'toggling'}
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
                                key: generateKey(e.target.value) // Auto-generate key on title change
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
                              disabled={saving === 'updating' || !editingOption.title || !editingOption.key || !editingOption.employee_text}
                              className="p-2 text-success-600 hover:bg-success-50 rounded"
                            >
                              {saving === 'updating' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
                                  setEditingOption(option); // Pre-fill editing state
                                }}
                                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOption(option.id)}
                                disabled={saving === 'deleting'}
                                className="p-2 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded"
                              >
                                {saving === 'deleting' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                  <Clock className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
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
                          disabled // This is a preview, so checkboxes are disabled
                        />
                        <span className="text-sm text-neutral-700">{option.employee_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Settings Section */}
        {activeSection === 'system' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Configurare Sistem General</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Ora limită pontaj
                  </label>
                  <input
                    type="time"
                    value={settingsForm.pontaj_cutoff_time}
                    onChange={(e) => handleSettingChange('pontaj_cutoff_time', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">După această oră, angajații nu mai pot completa pontajul</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Zile concediu maxime pe an
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settingsForm.max_leave_days_per_year}
                    onChange={(e) => handleSettingChange('max_leave_days_per_year', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-900">Pontaj în weekend</h4>
                    <p className="text-sm text-neutral-600">Permite angajaților să completeze pontajul în weekend</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.allow_weekend_pontaj === 'true'}
                    onChange={(e) => handleSettingChange('allow_weekend_pontaj', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-900">Note zilnice obligatorii</h4>
                    <p className="text-sm text-neutral-600">Angajații trebuie să completeze note pentru fiecare zi</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.require_daily_notes === 'true'}
                    onChange={(e) => handleSettingChange('require_daily_notes', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-900">Notificări email</h4>
                    <p className="text-sm text-neutral-600">Trimite notificări prin email pentru evenimente importante</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.email_notifications === 'true'}
                    onChange={(e) => handleSettingChange('email_notifications', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-200">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving === 'settings'}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving === 'settings' ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Se salvează...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvează Setările
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Section Placeholder */}
        {activeSection === 'security' && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Configurare Securitate</h2>
            <p className="text-neutral-600">Secțiunea de securitate va fi implementată în viitor.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}