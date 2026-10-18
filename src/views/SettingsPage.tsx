import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Phone, Save, CheckCircle2, Sliders } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { systemConfig, updateConfig, phoneOverride } = useApp();

  const [escalationSeconds, setEscalationSeconds] = useState<number>(systemConfig.escalationSeconds);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(systemConfig.confidenceThreshold * 100);
  const [language, setLanguage] = useState<'bilingual' | 'hindi' | 'english'>(systemConfig.language);
  const [phoneInput, setPhoneInput] = useState<string>(phoneOverride);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  // Requirement A.12: Page window title formula
  useEffect(() => {
    document.title = 'Settings | NetraGridAI';
  }, []);

  useEffect(() => {
    setEscalationSeconds(systemConfig.escalationSeconds);
    setConfidenceThreshold(systemConfig.confidenceThreshold * 100);
    setLanguage(systemConfig.language);
    setPhoneInput(phoneOverride);
  }, [systemConfig, phoneOverride]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setSaveError('');
    try {
      await updateConfig({
        escalationSeconds,
        confidenceThreshold: confidenceThreshold / 100,
        language,
        phoneOverride: phoneInput,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save configuration.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px] mx-auto font-sans">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#0B7FF5]" />
            <span>Emergency Escalation & Dispatch Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure persisted escalation deadlines, confidence thresholds, language, and responder details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-amber-500" />
            <span>Escalation Rules & Confidence Thresholds</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-600 uppercase font-bold flex justify-between">
                <span>Escalation Timeout (Seconds)</span>
                <span className="text-[#0B7FF5] font-extrabold">{escalationSeconds} seconds</span>
              </label>
              <input
                type="range"
                min="5"
                max="60"
                value={escalationSeconds}
                onChange={(e) => setEscalationSeconds(Number(e.target.value))}
                className="w-full accent-[#0B7FF5]"
              />
              <p className="text-[11px] text-slate-400">
                Database deadline before an incident is marked auto-escalated. A live dispatch worker is not connected.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-600 uppercase font-bold flex justify-between">
                <span>YOLOv8 Minimum Confidence Gate</span>
                <span className="text-[#0B7FF5] font-extrabold">{confidenceThreshold}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-[#0B7FF5]"
              />
              <p className="text-[11px] text-slate-400">
                Stored threshold for a future connected inference service. Default: 85%.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Phone className="w-5 h-5 text-emerald-600" />
            <span>Dispatch Preferences & Responders</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-600 uppercase font-bold">
                Voice Language Preference
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg p-2.5 font-mono focus:outline-none font-semibold"
              >
                <option value="bilingual">Bilingual (Hindi + English Consecutive)</option>
                <option value="hindi">Hindi Only (हिन्दी)</option>
                <option value="english">English Only</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-600 uppercase font-bold">
                Default E.164 Responder Trunk
              </label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg p-2.5 font-mono focus:outline-none font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-xl shadow-xs">
          {savedSuccess ? (
            <div className="text-xs text-emerald-600 font-mono font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings updated successfully!</span>
            </div>
          ) : saveError ? (
            <span className="text-xs text-red-600 font-mono">{saveError}</span>
          ) : (
            <span className="text-xs text-slate-400">Changes are saved to the shared Supabase configuration.</span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0B7FF5] text-white font-bold text-xs rounded-lg hover:bg-blue-600 transition-calm flex items-center space-x-2 shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            <span>SAVE DISPATCH CONFIGURATION</span>
          </button>
        </div>
      </form>
    </div>
  );
};
