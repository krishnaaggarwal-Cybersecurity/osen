import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CommandMapComponent } from '../components/map/CommandMapComponent';
import { Map, Layers, Radio } from 'lucide-react';

export const MapPage: React.FC = () => {
  const { incidents } = useApp();

  // Requirement A.12: Page window title formula
  useEffect(() => {
    document.title = 'Map | NetraGridAI';
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Map className="w-5 h-5 text-[#0B7FF5]" />
            <span>Smart City Emergency GIS Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geospatial tracking of high-density blackspots, active CCTV feeds, and emergency responders.
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#0B7FF5] font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>GIS STREAM LIVE</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#0B7FF5]" />
            <span className="font-bold text-slate-900">Delhi NCR Sector 4 Corridor (NH-48)</span>
          </div>
          <span className="text-slate-500">4 Active Incidents Marked</span>
        </div>

        <CommandMapComponent incidents={incidents} height="650px" />
      </div>
    </div>
  );
};
