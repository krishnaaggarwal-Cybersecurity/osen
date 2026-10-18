import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { INITIAL_DEMO_CLIPS } from '../lib/mockData';
import { Flame, Phone, Play, CheckCircle2, Terminal, RefreshCw, Zap } from 'lucide-react';

export const DemoPage: React.FC = () => {
  const {
    activeClip,
    setActiveClip,
    phoneOverride,
    setPhoneOverride,
    operator,
    maskedPhone,
    triggerCollision,
    eventLogs,
    resetDemoData,
    addEventLog,
  } = useApp();

  const [phoneInput, setPhoneInput] = useState<string>(phoneOverride);
  const [phoneSaved, setPhoneSaved] = useState<boolean>(true);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  useEffect(() => {
    setPhoneInput(phoneOverride);
  }, [phoneOverride]);

  // Requirement A.12: Page window title formula
  useEffect(() => {
    document.title = 'Demo | NetraGridAI';
  }, []);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setPhoneOverride(phoneInput);
      setPhoneSaved(true);
      addEventLog('action', 'Saved responder phone configuration.');
    } catch {
      setPhoneSaved(false);
    }
  };

  const handleTriggerStageStunt = () => {
    triggerCollision();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans">
      {/* Stage Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <Flame className="w-5 h-5 text-[#0B7FF5]" />
            <h1 className="text-xl font-bold text-slate-900 tracking-wide uppercase font-mono">
              Stage Demo Console
            </h1>
            <span className="bg-blue-50 text-[#0B7FF5] text-xs font-mono px-2.5 py-0.5 rounded-md border border-blue-200 font-bold">
              STAGE CONTROLLER
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create sample incidents and review the persisted escalation workflow.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={resetDemoData}
            className="px-4 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono hover:bg-slate-200 transition-calm flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Persisted State</span>
          </button>

          {/* Requirement A.8: Single line button text */}
          <button
            onClick={handleTriggerStageStunt}
            className="px-6 py-3 rounded-full bg-[#0B7FF5] text-white font-bold text-xs tracking-wider uppercase hover:bg-blue-600 active:scale-[0.99] transition-calm flex items-center space-x-2 shadow-lg shadow-blue-500/25 whitespace-nowrap flex-nowrap shrink-0"
          >
            <Zap className="w-4 h-4 fill-current shrink-0" />
            <span className="whitespace-nowrap flex-nowrap">TRIGGER COLLISION ALERT NOW</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Phone Override & Clip Selector */}
        <div className="lg:col-span-7 space-y-6">
          {/* Phone Override */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#0B7FF5]" />
                <h2 className="font-bold text-sm text-slate-900">Responder Phone Configuration</h2>
              </div>
              <span className="text-xs font-mono text-[#0B7FF5] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md font-bold">
                Masked: {maskedPhone}
              </span>
            </div>

            {operator.role === 'supervisor' || operator.role === 'admin' ? (
              <form onSubmit={handleSavePhone} className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      setPhoneSaved(false);
                    }}
                    placeholder="+91 9876543210"
                    className="flex-1 bg-slate-50 border border-slate-200 focus:border-[#0B7FF5] rounded-lg px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none transition-calm font-medium"
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-calm ${
                      phoneSaved
                        ? 'bg-slate-100 text-slate-500 border border-slate-200'
                        : 'bg-[#0B7FF5] text-white hover:bg-blue-600'
                    }`}
                  >
                    {phoneSaved ? 'Saved' : 'Save Phone'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  E.164 format. This value is saved in Supabase; voice-call dispatch requires a configured provider integration.
                </p>
              </form>
            ) : (
              <p className="text-[11px] text-slate-500">Only supervisors can change the responder number.</p>
            )}
          </div>

          {/* Pre-recorded MP4 Clips */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-[#0B7FF5]" />
                <h2 className="font-bold text-sm text-slate-900">Pre-Recorded Demo Video Feeds</h2>
              </div>
              <label className="flex items-center space-x-2 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B7FF5] focus:ring-0 accent-[#0B7FF5]"
                />
                <span>Auto-play on trigger</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {INITIAL_DEMO_CLIPS.map((clip) => {
                const isSelected = activeClip.id === clip.id;
                return (
                  <div
                    key={clip.id}
                    onClick={() => setActiveClip(clip)}
                    className={`p-3 rounded-xl border transition-calm cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-blue-50/50 border-[#0B7FF5] shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                      <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" />
                      <div className="absolute top-1.5 right-1.5 bg-black/80 font-mono text-[10px] text-white px-1.5 py-0.5 rounded">
                        {clip.duration}
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#0B7FF5]/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-[#0B7FF5]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">{clip.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Trigger: {clip.expectedTriggerTime}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Log ONLY (Requirement A.6: Stage Readiness Checklist REMOVED) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#0B7FF5]" />
                <h2 className="font-bold text-sm text-slate-900">Live Event Log</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Supabase incident log</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 h-[420px] overflow-y-auto font-mono text-xs space-y-2.5">
              {eventLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2">
                  <span className="text-slate-500 shrink-0 text-[10px]">[{log.timestamp}]</span>
                  <span className="font-bold shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-sky-400 border border-blue-800">
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-slate-200 break-all text-[11px]">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
