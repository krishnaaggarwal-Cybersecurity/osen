import React from 'react';
import { CheckCircle2, PhoneCall, X, MapPin, Radio, AlertOctagon, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EscalationModal: React.FC = () => {
  const {
    isEscalationModalOpen,
    closeEscalationModal,
    activeEscalationIncident,
    dismissIncident,
    acknowledgeIncident,
    dispatchIncident,
    maskedPhone,
    systemConfig,
  } = useApp();

  if (!isEscalationModalOpen || !activeEscalationIncident) {
    return null;
  }

  const inc = activeEscalationIncident;
  const remaining = Math.max(0, inc.remainingSeconds);
  const isPending = inc.status === 'AWAITING' || inc.status === 'DETECTED';
  const canRequestDispatch = isPending || inc.status === 'AUTO-ESCALATED';

  const isAwaiting = isPending && remaining > 0;

  // Compact circular progress calculation
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (remaining / systemConfig.escalationSeconds) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150 font-sans select-none overflow-y-auto">
      {/* Item 4: Fit screen height without getting cropped: max-h-[94vh], compact scaling */}
      <div className="w-full max-w-4xl lg:max-w-5xl max-h-[94vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header Banner - Compact height */}
        <div className="bg-[#06172E] px-5 sm:px-6 py-3 text-white flex items-center justify-between border-b border-blue-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 shrink-0">
              <AlertOctagon className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-sky-400">
                  CRITICAL COLLISION ALERT DETECTED
                </span>
                <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase">
                  {inc.severity}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 leading-tight">
                Sample incident preset &bull; Manual operator review
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="bg-slate-800 text-sky-400 font-mono text-xs px-2.5 py-1 rounded-md border border-slate-700 font-bold">
              {(inc.confidence * 100).toFixed(0)}% CONF
            </span>
            <button
              onClick={closeEscalationModal}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-calm cursor-pointer"
              title="Close Alert Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable if screen is extremely small, perfectly fits normal laptop heights */}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5 overflow-y-auto flex-1">
          
          {/* Incident Snapshot & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
            
            {/* Snapshot Image with Bounding Boxes */}
            <div className="md:col-span-7 flex flex-col justify-center">
              <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-black flex items-center justify-center shadow-xs aspect-video max-h-[190px] xl:max-h-[220px] w-full">
                <img
                  src={inc.snapshotUrl}
                  alt="Accident Snapshot with Bounding Boxes"
                  className="w-full h-full object-cover"
                />
                
                {/* CV Inference HUD Stamp */}
                <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-sm font-mono text-[10px] text-[#0B7FF5] px-2 py-0.5 rounded border border-slate-700 flex items-center space-x-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold text-white">{inc.cameraId}</span>
                  <span className="text-slate-400">|</span>
                  <span>SAMPLE EVIDENCE PREVIEW</span>
                </div>

                <div className="absolute bottom-2 right-2 bg-slate-900/90 backdrop-blur-sm font-mono text-[9px] text-slate-300 px-2 py-0.5 rounded border border-slate-700 shadow">
                  CLASS: <span className="text-sky-400 font-bold">{inc.vehicleType}</span>
                </div>
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-1 flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3 text-[#0B7FF5] shrink-0" />
                <span className="truncate">AI Feed &bull; Bounding boxes and trajectory conflict vectors tracked</span>
              </p>
            </div>

            {/* Right Column: Telemetry & Vehicle Metadata */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-2 text-xs">
              <div>
                <div className="text-slate-500 font-mono uppercase text-[9px] font-bold tracking-wider">
                  Location & Sector
                </div>
                <div className="font-bold text-slate-900 text-sm flex items-start space-x-1 mt-0.5 leading-snug">
                  <MapPin className="w-4 h-4 text-[#0B7FF5] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{inc.location}</span>
                </div>
                <div className="font-mono text-slate-500 text-[10px] mt-1 bg-white px-2 py-1 rounded border border-slate-200">
                  GPS: <span className="text-slate-800 font-bold">{inc.coordinates.lat.toFixed(4)}° N, {inc.coordinates.lng.toFixed(4)}° E</span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-200 grid grid-cols-2 gap-2 font-mono">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[9px] block font-bold">INCIDENT ID</span>
                  <span className="text-[#0B7FF5] font-bold text-xs">{inc.id}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[9px] block font-bold">IMPACT SPEED</span>
                  <span className="text-slate-900 font-bold text-xs">{inc.impactSpeed}</span>
                </div>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-mono uppercase font-bold">Type:</span>
                  <span className="bg-blue-50 text-[#0B7FF5] font-mono px-1.5 py-0.2 rounded font-bold border border-blue-200">
                    {(inc.confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-xs truncate">{inc.vehicleType}</div>
              </div>
            </div>
          </div>

          {/* Server-verified deadline and incident status */}
          {isAwaiting ? (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r={radius}
                      className="stroke-slate-200"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r={radius}
                      stroke="#0B7FF5"
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-mono font-extrabold text-lg text-slate-900 tracking-tighter leading-none">
                      {remaining}s
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
                      Left
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                    Auto-Escalation Failsafe Timer
                  </h3>
                  <p className="text-[11px] text-slate-600 max-w-md">
                    If no action is taken within <span className="font-mono text-[#0B7FF5] font-bold">{remaining} seconds</span>, the server records the incident as auto-escalated.
                  </p>
                </div>
              </div>

              <div className="hidden sm:block text-right bg-white px-3 py-2 rounded-lg border border-slate-200 shrink-0 font-mono text-xs">
                <div className="text-slate-400 text-[9px] font-bold uppercase">Configured Responder Number</div>
                <div className="font-bold text-[#0B7FF5] text-xs">{maskedPhone}</div>
                <div className="text-[9px] text-slate-500">Configured target only; not connected</div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-[#0B7FF5] animate-pulse" />
                  <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                    Escalation & Dispatch Status
                  </span>
                  {inc.status === 'AUTO-ESCALATED' && (
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
                      Failsafe Triggered
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-[#0B7FF5] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-bold">
                  Target: {maskedPhone}
                </span>
              </div>

              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                {inc.status === 'AUTO-ESCALATED'
                  ? 'The deadline was verified and recorded in Supabase. No phone call is placed until a dispatch provider is integrated.'
                  : 'Dispatch actions are recorded in Supabase; live emergency-service calls are not configured.'}
              </p>
            </div>
          )}

          {/* Action Buttons - Always visible at bottom, never cropped */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Button 3a: Dismiss */}
            <button
              onClick={() => dismissIncident(inc.id)}
              disabled={!isPending}
              className="py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-calm flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              title="The AI false flagged and no accident occurred visibly"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>DISMISS</span>
            </button>

            {/* Button 3b: Acknowledge */}
            <button
              onClick={() => acknowledgeIncident(inc.id)}
              disabled={!isPending}
              className={`py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-calm flex items-center justify-center space-x-1.5 cursor-pointer ${
                inc.status === 'ACKNOWLEDGED'
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
              }`}
              title="To acknowledge that incident has taken place but due to lack of severity immediate action is not taken"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ACKNOWLEDGE</span>
            </button>

            {/* Button 3c: Dispatch Help */}
            <button
              onClick={() => dispatchIncident(inc.id, '112 ERSS & 108 CATS')}
              disabled={!canRequestDispatch}
              className="py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-calm flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/25 cursor-pointer"
              title="Record a dispatch request; this does not place a call"
            >
              <PhoneCall className="w-4 h-4" />
              <span>REQUEST DISPATCH</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
