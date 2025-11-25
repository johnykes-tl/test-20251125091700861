import React from 'react';
import { Save, RefreshCw, Clock, Calendar, Mail } from 'lucide-react';
import { FormField, CheckboxField } from '../../../shared/components/FormFields';

interface SystemSettingsFormProps {
  settings: {
    pontaj_cutoff_time: string;
    allow_weekend_pontaj: string;
    require_daily_notes: string;
    max_leave_days_per_year: string;
    email_notifications: string;
  };
  onSettingChange: (key: string, value: string) => void;
  onSave: () => Promise<void>;
  loading?: string | null;
}

export default function SystemSettingsForm({
  settings,
  onSettingChange,
  onSave,
  loading = null
}: SystemSettingsFormProps) {
  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-6">Configurare Sistem General</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Ora limită pontaj
            </label>
            <input
              type="time"
              value={settings.pontaj_cutoff_time}
              onChange={(e) => onSettingChange('pontaj_cutoff_time', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-neutral-500 mt-1">După această oră, angajații nu mai pot completa pontajul</p>
          </div>

          <FormField
            label="Zile concediu maxime pe an"
            id="max_leave_days_per_year"
            type="number"
            value={settings.max_leave_days_per_year}
            onChange={(e) => onSettingChange('max_leave_days_per_year', e.target.value)}
            min="1"
            max="50"
            icon={Calendar}
          />
        </div>

        <div className="space-y-4">
          <CheckboxField
            label="Pontaj în weekend"
            id="allow_weekend_pontaj"
            checked={settings.allow_weekend_pontaj === 'true'}
            onChange={(e) => onSettingChange('allow_weekend_pontaj', e.target.checked ? 'true' : 'false')}
            description="Permite angajaților să completeze pontajul în weekend"
          />

          <CheckboxField
            label="Note zilnice obligatorii"
            id="require_daily_notes"
            checked={settings.require_daily_notes === 'true'}
            onChange={(e) => onSettingChange('require_daily_notes', e.target.checked ? 'true' : 'false')}
            description="Angajații trebuie să completeze note pentru fiecare zi"
          />

          <CheckboxField
            label="Notificări email"
            id="email_notifications"
            checked={settings.email_notifications === 'true'}
            onChange={(e) => onSettingChange('email_notifications', e.target.checked ? 'true' : 'false')}
            description="Trimite notificări prin email pentru evenimente importante"
            icon={Mail}
          />
        </div>

        <div className="pt-6 border-t border-neutral-200">
          <button
            onClick={onSave}
            disabled={loading === 'settings'}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading === 'settings' ? (
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
  );
}