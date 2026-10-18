import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, AlertCircle, ArrowUpRight, CheckCircle2, PhoneCall, X } from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Requirement A.12: Page window title formula
  useEffect(() => {
    document.title = 'Incidents | NetraGridAI';
  }, []);

  // Item 11: Put dispatched events first on top
  const filteredIncidents = incidents
    .filter((inc) => {
      const matchesSearch =
        inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.cameraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inc.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const isDispatchedA = a.status === 'DISPATCHED' || a.status === 'AUTO-ESCALATED';
      const isDispatchedB = b.status === 'DISPATCHED' || b.status === 'AUTO-ESCALATED';
      if (isDispatchedA && !isDispatchedB) return -1;
      if (!isDispatchedA && isDispatchedB) return 1;
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-[#0B7FF5]" />
            <span>Incidents Audit Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full searchable audit trail of detected collisions, operator actions, and automated dispatches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-mono text-xs">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, camera, location..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#0B7FF5] rounded-lg px-3 py-2 text-xs text-slate-900 pl-9 focus:outline-none transition-calm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-lg px-3 py-2 focus:outline-none font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="AWAITING">AWAITING</option>
            <option value="DISMISSED">DISMISSED</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="AUTO-ESCALATED">AUTO-ESCALATED</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500 font-bold">
                <th className="py-3.5 px-6">Incident ID</th>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Camera Source</th>
                <th className="py-3.5 px-6">Location</th>
                <th className="py-3.5 px-6">Severity</th>
                <th className="py-3.5 px-6">Status & Outcome</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-mono">
                    No incidents match your filter. Trigger a collision alert in Demo Console.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="hover:bg-slate-50 transition-calm cursor-pointer"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-[#0B7FF5]">{inc.id}</td>
                    <td className="py-4 px-6 font-mono text-slate-500">
                      {new Date(inc.detectedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">{inc.cameraName}</td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">{inc.location}</td>
                    <td className="py-4 px-6">
                      <span className="bg-red-100 text-red-700 border border-red-200 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {inc.status === 'DISMISSED' ? (
                        <span className="text-slate-500 font-mono text-[11px] flex items-center space-x-1">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                          <span>DISMISSED</span>
                        </span>
                      ) : inc.status === 'ACKNOWLEDGED' ? (
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono text-[11px] font-bold flex items-center space-x-1.5 w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>ACKNOWLEDGED</span>
                        </span>
                      ) : inc.status === 'AUTO-ESCALATED' || inc.status === 'DISPATCHED' ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono text-[11px] font-bold flex items-center space-x-1.5 w-fit">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{inc.status}</span>
                        </span>
                      ) : (
                        <span className="text-[#0B7FF5] font-mono text-[11px] font-bold">
                          {inc.status} ({inc.remainingSeconds}s)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/incidents/${inc.id}`);
                        }}
                        className="px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 text-[#0B7FF5] hover:bg-[#0B7FF5] hover:text-white transition-calm font-mono text-[11px] inline-flex items-center space-x-1 font-bold"
                      >
                        <span>View Brief</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
