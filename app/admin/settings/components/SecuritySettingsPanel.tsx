'use client';

import React from 'react';

interface SecuritySettings {
  passwordMinLength: number;
  requirePasswordChange: boolean;
  sessionTimeout: number;
  twoFactorAuth: boolean;
  allowRemoteAccess: boolean;
}

interface SecuritySettingsPanelProps {
  settings: SecuritySettings;
  onSettingsChange: (settings: SecuritySettings) => void;
}

export default function SecuritySettingsPanel({ settings, onSettingsChange }: SecuritySettingsPanelProps) {
  const updateSetting = (key: keyof SecuritySettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-8">
      {/* Security Settings */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Configurare Securitate</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Lungime minimă parolă
            </label>
            <input
              type="number"
              min="6"
              max="20"
              value={settings.passwordMinLength}
              onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Timeout sesiune (minute)
            </label>
            <input
              type="number"
              min="30"
              max="1440"
              value={settings.sessionTimeout}
              onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-neutral-900">Schimbare parolă obligatorie</h4>
                <p className="text-sm text-neutral-600">Utilizatorii trebuie să-și schimbe parola la prima conectare</p>
              </div>
              <input
                type="checkbox"
                checked={settings.requirePasswordChange}
                onChange={(e) => updateSetting('requirePasswordChange', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-neutral-900">Autentificare cu doi factori</h4>
                <p className="text-sm text-neutral-600">Activează 2FA pentru securitate suplimentară</p>
              </div>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => updateSetting('twoFactorAuth', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-neutral-900">Acces remote</h4>
                <p className="text-sm text-neutral-600">Permite conectarea din afara rețelei companiei</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowRemoteAccess}
                onChange={(e) => updateSetting('allowRemoteAccess', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}