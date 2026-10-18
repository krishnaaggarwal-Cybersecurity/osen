import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { EscalationModal } from '../escalation/EscalationModal';
import { useApp } from '../../context/AppContext';

export const OpsLayout: React.FC = () => {
  const { operationError, clearOperationError } = useApp();

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-[#0B7FF5] overflow-hidden">
      <TopBar />
      {operationError && (
        <div role="alert" className="z-40 flex items-center justify-between gap-4 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">
          <span>{operationError}</span>
          <button onClick={clearOperationError} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] relative">
          <Outlet />
        </main>
      </div>
      <EscalationModal />
    </div>
  );
};
