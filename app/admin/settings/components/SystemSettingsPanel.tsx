'use client';

import React from 'react';

interface SystemSettings {
  pontajCutoffTime: string;
  allowWeekendPontaj: boolean;
  requireDailyNotes: boolean;
  autoApproveLeave: boolean;
  maxLeaveDaysPerYear: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface SystemSettingsPanelProps {
  settings: SystemSettings;
  onSettingsChange: (settings: SystemSettings) => void;
}

export default function SystemSettingsPanel({ settings, onSettingsChange }: SystemSettingsPanelProps) {
  const updateSetting = (key: keyof SystemSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-8">
      {/* Pontaj Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Configurare Pontaj</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Ora limită pontaj
            </label>
            <input
              type="time"
              value={settings.pontajCutoffTime}
              onChange={(e) => updateSetting('pontajCutoffTime', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              value={settings.maxLeaveDaysPerYear}
              onChange={(e) => updateSetting('maxLeaveDaysPerYear', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-neutral-900">Pontaj în weekend</h4>
                <p className="text-sm text-neutral-600">Permite angajaților să completeze pontajul în weekend</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowWeekendPontaj}
                onChange={(e) => updateSetting('allowWeekendPontaj', e.target.checked)}
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
                checked={settings.requireDailyNotes}
                onChange={(e) => updateSetting('requireDailyNotes', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-neutral-900">Aprobare automată concedii</h4>
                <p className="text-sm text-neutral-600">Concediile se aprobă automat fără intervenție manuală</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoApproveLeave}
                onChange={(e) => updateSetting('autoApproveLeave', e.target.checked)}
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
                checked={settings.emailNotifications}
                onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-neutral-900">Notificări SMS</h4>
                <p className="text-sm text-neutral-600">Trimite notificări prin SMS pentru evenimente urgente</p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => updateSetting('smsNotifications', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}