'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Users,
  Target,
  Settings,
  Archive
} from 'lucide-react';
import { testsApi } from '../../lib/api/testsApi';
import type { Test, TestAssignmentWithDetails, TestStats } from '../../lib/types/tests';
import TestForm from './components/TestForm';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminTestsPage() {
  // State management
  const [activeTab, setActiveTab] = useState<'tests' | 'cron'>('tests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Cron scheduler state - only initialized client-side
  const [cronScheduler, setCronScheduler] = useState<any>(null);
  const [cronLoading, setCronLoading] = useState(false);

  // Data states
  const [tests, setTests] = useState<Test[]>([]);
  const [stats, setStats] = useState<TestStats>({
    totalTests: 0,
    activeTests: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    eligibleEmployees: 0
 });

  // Initialize cron scheduler on client-side only
  useEffect(() => {
    const initializeCronScheduler = async () => {
      try {
        setCronLoading(true);
        console.log('📅 Initializing cron scheduler client-side...');
        
        // Dynamic import to ensure client-side only execution
        const { cronScheduler: scheduler } = await import('../../lib/services/cronService');
        
        // Verify environment before setting
        const envInfo = scheduler.getEnvironmentInfo();
        console.log('🔧 Cron scheduler environment:', envInfo);
        
        if (envInfo.canExecute) {
          setCronScheduler(scheduler);
          console.log('✅ Cron scheduler initialized successfully');
        } else {
          console.log('⚠️ Cron scheduler not available (server environment)');
        }
      } catch (error) {
        console.error('❌ Failed to initialize cron scheduler:', error);
      } finally {
        setCronLoading(false);
      }
    };

    // Only run on client-side
    if (typeof window !== 'undefined') {
      initializeCronScheduler();
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Loading tests management data...');

      const { tests: testsData, stats: statsData } = await testsApi.getTestsWithStats();
      setTests(testsData as Test[]);
      setStats(statsData);

      console.log('✅ Tests management data loaded:', {
        tests: testsData.length,
        stats: statsData
      });

    } catch (error: any) {
      console.error('❌ Error loading tests data:', error);
      setError(error.message || 'Failed to load tests data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAllData();
  };

   // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  const handleAdd = () => {
   setEditingTest(null);
     setShowForm(true);
 };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
     setShowForm(true);
 };

  const handleDelete = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test || !confirm(`Delete "${test.title}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(testId);
    setError(null);

    try {
      await testsApi.deleteTest(testId);
      setTests(prev => prev.filter(t => t.id !== testId));
      setSuccess('Test deleted successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to delete test');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setActionLoading(testId);
    setError(null);

    try {
      const newStatus = test.status === 'active' ? 'inactive' : 'active';
      const updated = await testsApi.updateTest(testId, { status: newStatus });
      setTests(prev => prev.map(t => t.id === testId ? (updated as Test) : t));
    } catch (error: any) {
      setError(error.message || 'Failed to update test status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test || !confirm(`Archive "${test.title}"? Archived tests won't be assigned but will remain in the system.`)) {
      return;
    }

    setActionLoading(testId);
    setError(null);

    try {
      const updated = await testsApi.updateTest(testId, { status: 'archived' });
      setTests(prev => prev.map(t => t.id === testId ? (updated as Test) : t));
      setSuccess('Test archived successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to archive test');
    } finally {
      setActionLoading(null);
    }
  };

 const handleManualCronTrigger = async () => {
   setActionLoading('cron-trigger');
    setError(null);

    try {
       console.log('🎯 Manual trigger: Reassigning today\'s tests...');
      
      // Call API directly with today's date
      const response = await fetch('/api/tests/assign-daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0]
        }),
      });
     
       const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log('✅ Manual assignment result:', result.data);
      
      setSuccess(`Tests reassigned successfully! ${result.message}`);
     // Reload data
      await loadAllData();
      
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to trigger manual assignment');
    } finally {
      setActionLoading(null);
    }
  };

       console.error('❌ Manual trigger failed:', error);
 // Enhanced status functions to support archived
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'inactive':
        return 'bg-neutral-100 text-neutral-700';
      case 'archived':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activ';
      case 'inactive':
        return 'Inactiv';
      case 'archived':
        return 'Arhivat';
      default:
        return 'Necunoscut';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'inactive':
        return <Clock className="h-4 w-4" />;
      case 'archived':
        return <Archive className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Get cron job status safely
  const cronJob = cronScheduler?.getJobStatus('daily-test-assignment');

  // Loading state
  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-neutral-600">Loading tests management...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Management Teste</h1>
            <p className="text-neutral-600">Gestionează testele și atribuirile zilnice pentru angajați</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
               onClick={handleAdd}
             className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adaugă Test
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
            <p className="text-sm text-success-700">{success}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-3">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-neutral-600">Total Teste</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalTests}</p>
              </div>
              <p className="text-xs text-neutral-500">{stats.activeTests} active</p>
          </div>

          <div className="card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-warning-600" />
                <span className="text-sm font-medium text-neutral-600">În Așteptare</span>
              </div>
              <p className="text-2xl font-bold text-warning-600">{stats.pendingAssignments}</p>
            </div>
            <p className="text-xs text-neutral-500">teste pendente</p>
          </div>

          <div className="card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-600">Angajați Eligibili</span>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{stats.eligibleEmployees}</p>
            </div>
            <p className="text-xs text-neutral-500">pot primi teste</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-neutral-200 mb-8">
          <nav className="flex">
            {[
              { id: 'tests', label: 'Liste Teste', icon: Target },
              { id: 'cron', label: 'Automatizare', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="card">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">Lista Teste</h2>
            </div>
            
            <div className="divide-y divide-neutral-200">
              {tests.map((test) => (
                <div key={test.id} className="p-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-neutral-900">{test.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusBadgeColor(test.status)}`}>
                          {getStatusIcon(test.status)}
                          {getStatusText(test.status)}
                        </span>
                      </div>
                      <p className="text-neutral-600 mb-2">{test.description}</p>
                      {test.instructions && (
                        <p className="text-sm text-neutral-500 mb-2">
                          <strong>Instrucțiuni:</strong> {test.instructions}
                        </p>
                      )}
                      <div className="text-xs text-neutral-400">
                        Creat la: {new Date(test.created_at).toLocaleDateString('ro-RO')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(test)}
                        disabled={actionLoading === test.id}
                        className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {/* Toggle Active/Inactive (only for active and inactive tests) */}
                      {test.status !== 'archived' && (
                        <button
                          onClick={() => handleToggleStatus(test.id)}
                          disabled={actionLoading === test.id}
                          className="p-2 text-neutral-600 hover:text-warning-600 hover:bg-warning-50 rounded"
                        >
                          {actionLoading === test.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : test.status === 'active' ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      
                      {/* Archive Button (only for active and inactive tests) */}
                      {test.status !== 'archived' && (
                        <button
                          onClick={() => handleArchiveTest(test.id)}
                          disabled={actionLoading === test.id}
                          className="p-2 text-neutral-600 hover:text-warning-600 hover:bg-warning-50 rounded"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(test.id)}
                        disabled={actionLoading === test.id}
                        className="p-2 text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {tests.length === 0 && (
                <div className="p-8 text-center">
                  <Target className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">Nu există teste configurate încă.</p>
                  <p className="text-sm text-neutral-400 mt-1">Adaugă primul test folosind butonul din header.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cron Tab */}
        {activeTab === 'cron' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Automatizare Atribuiri</h2>
              
              {cronLoading && (
                <div className="flex items-center gap-2 mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary-600" />
                  <span className="text-primary-700">Se încarcă planificatorul...</span>
                </div>
              )}

              {!cronScheduler && !cronLoading && (
                <div className="mb-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <p className="text-warning-700">⚠️ Planificatorul automat nu este disponibil (mediu server-side)</p>
                  <p className="text-sm text-warning-600 mt-1">
                    Funcționalitatea de planificare automată funcționează doar în browser.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-neutral-900">Daily Test Assignment</h3>
                    <p className="text-sm text-neutral-600">Atribuie automat teste în fiecare zi la miezul nopții</p>
                    <p className="text-xs text-neutral-500">Schedule: 0 0 * * * (zilnic la 00:00)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      {cronJob ? (
                        <>
                          <p className={`font-medium ${cronJob.enabled ? 'text-success-600' : 'text-neutral-500'}`}>
                            {cronJob.enabled ? 'Activ' : 'Inactiv'}
                          </p>
                          {cronJob.lastRun && (
                            <p className="text-neutral-500">
                              Ultima rulare: {cronJob.lastRun.toLocaleString('ro-RO')}
                            </p>
                          )}
                          {cronJob.nextRun && (
                            <p className="text-neutral-500">
                              Următoarea: {cronJob.nextRun.toLocaleString('ro-RO')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-neutral-500">
                          {cronScheduler ? 'Job nu a fost găsit' : 'Planificator indisponibil'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleManualCronTrigger}
                      disabled={actionLoading === 'cron-trigger'}
                      className="btn-secondary flex items-center gap-2"
                    >
                      {actionLoading === 'cron-trigger' ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Se reassignează...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Rulează Acum (Schimbă Testerii)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-medium text-primary-900 mb-2">Cum funcționează automatizarea:</h4>
                  <ul className="text-sm text-primary-700 space-y-1">
                    <li>• Planificatorul rulează doar în browser (client-side)</li>
                    <li>• Selectează angajații eligibili (marcați + nu în concediu)</li>
                      <li>• <strong>ȘTERGE toate assignările existente</strong> pentru ziua curentă</li>
                      <li>• <strong>RECREEAZĂ assignări noi</strong> cu angajați diferiți</li>
                      <li>• Atribuie fiecare test activ la maxim 2 persoane aleatoriu</li>
                    <li>• Un angajat poate primi multiple teste diferite</li>
                      <li>• <strong>La fiecare apăsare = TESTERII NOI!</strong></li>
                  </ul>
                </div>

                {cronScheduler && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <h4 className="font-medium text-success-900 mb-2">🚀 Planificator Activ</h4>
                    <div className="text-sm text-success-700">
                      <p>Planificatorul este activ și funcțional în acest browser.</p>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <strong>Status:</strong> {cronScheduler.isInitialized() ? 'Inițializat' : 'În curs de inițializare'}
                        </div>
                        <div>
                          <strong>Joburi active:</strong> {cronScheduler.getAllJobs().length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Test Modal */}
         <TestForm 
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSave={loadAllData}
          test={editingTest}
        />
     </div>
    </DashboardLayout>
  );
}