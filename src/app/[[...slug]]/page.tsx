'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../App'), { ssr: false });

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-mono text-xs text-slate-500">
        Loading NetraGridAI Emergency Command Console...
      </div>
    );
  }

  return <App />;
}
