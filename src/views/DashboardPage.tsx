import React, { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LiveVideoFeed } from '../components/video/LiveVideoFeed';
import { IncidentCard } from '../components/incidents/IncidentCard';
import { CommandMapComponent } from '../components/map/CommandMapComponent';
import { AlertOctagon, Flame, ArrowUpRight, MapPin, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { operator, incidents, triggerCollision, openEscalationModal } = useApp();

  // Page title
  useEffect(() => {
    document.title = 'Dashboard | NetraGridAI';
  }, []);

  const awaitingIncidents = incidents.filter(
    (i) => i.status === 'AWAITING' || i.status === 'DETECTED'
  );

  // Item 11: Put dispatched events first on top
  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      const isDispatchedA = a.status === 'DISPATCHED' || a.status === 'AUTO-ESCALATED';
      const isDispatchedB = b.status === 'DISPATCHED' || b.status === 'AUTO-ESCALATED';
      if (isDispatchedA && !isDispatchedB) return -1;
      if (!isDispatchedA && isDispatchedB) return 1;
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });
  }, [incidents]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans">
      
      {/* Header with Assigned Sector (Item 1: Increased font size of sector text; Item 3: Removed header test alert button) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Operator Live Command Center</span>
          </h1>
          {/* Item 1: Increased font size of sector text */}
          <p className="text-sm md:text-base text-slate-700 mt-2 flex items-center space-x-2 font-mono font-medium">
            <MapPin className="w-4 h-4 text-[#0B7FF5] shrink-0" />
            <span className="text-slate-500 font-normal">Assigned Sector:</span>
            <span className="font-bold text-slate-900">{operator.assignedSector}</span>
          </p>
        </div>
      </div>

      {/* Top Banner (If Active Unacknowledged Incident) */}
      {awaitingIncidents.length > 0 && (
        <div className="bg-red-50 border-l-4 border-l-red-500 border border-red-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-500 text-white rounded-lg shadow-sm">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-red-900 tracking-wide uppercase">
                  {awaitingIncidents[0].id} &mdash; ACTIVE COLLISION ALERT
                </span>
                <span className="bg-red-200 text-red-900 border border-red-300 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
                  {awaitingIncidents[0].severity}
                </span>
              </div>
              <p className="text-xs text-red-700 mt-0.5 font-sans">
                {awaitingIncidents[0].location} &bull; Escalation deadline in{' '}
                <span className="font-mono text-red-900 font-bold">
                  {awaitingIncidents[0].remainingSeconds} seconds
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => openEscalationModal(awaitingIncidents[0])}
              className="px-5 py-2.5 rounded-full bg-red-600 text-white font-bold text-xs tracking-wider uppercase hover:bg-red-700 transition-calm shadow-md shadow-red-500/20 whitespace-nowrap cursor-pointer"
            >
              Open Decision Ring &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Video Stream (7 cols) + Active Incidents Column (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <LiveVideoFeed />

          {/* Mini Command Map */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-slate-900">Live GIS Blackspot Map</span>
                <span className="text-[11px] font-mono text-slate-500">(NH-48 Sector)</span>
              </div>
              <button
                onClick={() => navigate('/map')}
                className="text-xs text-[#0B7FF5] hover:underline flex items-center space-x-1 font-mono font-semibold"
              >
                <span>Full Map View</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <CommandMapComponent incidents={incidents} height="280px" />
          </div>
        </div>

        {/* Right Column: Active Incidents (Item 3: ONLY place with the Test Alert button in dashboard) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <span>Active Incidents</span>
                  <span className="bg-[#0B7FF5] text-white text-xs font-mono px-2.5 py-0.5 rounded-full font-bold">
                    {sortedIncidents.length}
                  </span>
                </h2>
              </div>

              {/* Item 3: The ONLY Test Alert button on the dashboard */}
              <button
                onClick={() => triggerCollision()}
                className="px-3.5 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[#0B7FF5] font-mono font-bold text-xs hover:bg-[#0B7FF5] hover:text-white transition-calm flex items-center space-x-1.5 whitespace-nowrap flex-nowrap shrink-0 shadow-xs cursor-pointer"
                title="Trigger simulated emergency collision alert"
              >
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap flex-nowrap">+ Test Alert</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
              {sortedIncidents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2.5">
                  <ShieldCheck className="w-8 h-8 text-[#0B7FF5] mx-auto opacity-70" />
                  <div className="text-xs font-mono font-bold text-slate-700">
                    No active collision incidents
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans max-w-xs mx-auto">
                    No incidents are recorded. Use the demo console to create a sample incident; live vision inference is not connected in this repository.
                  </p>
                </div>
              ) : (
                sortedIncidents.map((inc) => (
                  <IncidentCard key={inc.id} incident={inc} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
