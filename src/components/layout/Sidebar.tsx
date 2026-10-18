import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Map, Camera, Settings, LogOut, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { logout, incidents, operator } = useApp();
  const awaitingCount = incidents.filter((i) => i.status === 'AWAITING' || i.status === 'DETECTED').length;

  // Requirement A.3: Removed About / Pitch tab
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: awaitingCount > 0 ? awaitingCount : null },
    { path: '/demo', label: 'Demo Console', icon: Flame, isHighlight: true, badge: null },
    { path: '/incidents', label: 'Incidents', icon: AlertTriangle, badge: null },
    { path: '/map', label: 'Command Map', icon: Map, badge: null },
    { path: '/cameras', label: 'Cameras', icon: Camera, badge: null },
    ...(operator.role === 'supervisor' || operator.role === 'admin'
      ? [{ path: '/settings', label: 'Settings', icon: Settings, badge: null }]
      : []),
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between select-none font-sans shadow-sm shrink-0 h-full">
      <div className="py-6 px-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 pb-3 text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
          Control Panel
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-calm ${
                  item.isHighlight
                    ? isActive
                      ? 'bg-[#0B7FF5] text-white shadow-md'
                      : 'bg-blue-50 border border-blue-200 text-[#0B7FF5] hover:bg-blue-100'
                    : isActive
                    ? 'bg-slate-100 text-[#0B7FF5] border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 text-current" />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && item.badge > 0 && (
                <span className="bg-[#0B7FF5] text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Exit Session Button - Sticky to bottom of viewport/screen */}
      <div className="p-4 border-t border-slate-200 mt-auto sticky bottom-0 bg-white z-10 shrink-0">
        <button
          onClick={() => { void logout(); }}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-mono text-slate-600 hover:text-red-600 hover:bg-red-50 transition-calm border border-slate-200 hover:border-red-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};
