import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8 space-y-10 max-w-[1400px] mx-auto text-[#E6EDF7]">
      <div className="bg-gradient-to-r from-[#121A2E] via-[#1A2540] to-[#121A2E] p-8 rounded-2xl border border-[#26335A] space-y-4 text-center relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 bg-[#22D3EE]/10 border border-[#22D3EE]/30 px-3 py-1 rounded-full text-xs font-mono text-[#22D3EE] font-bold">
          <span>ICCC & 112 ERSS HACKATHON BLUEPRINT</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          NetraGridAI &mdash; Smart City Emergency Dispatcher
        </h1>
        <p className="max-w-3xl mx-auto text-sm md:text-base text-[#8FA1C0] leading-relaxed">
          Recovering India&apos;s lost <span className="text-[#22D3EE] font-bold">Golden Hour</span> with real-time AI computer vision on CCTV streams, automatic 15-second decision loops, and failsafe bilingual Twilio voice dispatch calls.
        </p>

        <div className="pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-[#22D3EE] text-[#0A0F1C] font-extrabold text-sm rounded-xl hover:bg-[#67E8F9] transition-all shadow-[0_0_25px_rgba(34,211,238,0.4)] inline-flex items-center space-x-2"
          >
            <span>Launch Live Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121A2E] border border-[#EF4444]/40 p-6 rounded-xl space-y-2">
          <div className="text-4xl font-extrabold font-mono text-[#EF4444]">44.5%</div>
          <div className="text-sm font-bold text-white">Two-Wheeler Road Fatalities</div>
          <p className="text-xs text-[#8FA1C0]">
            Over 44% of Indian traffic deaths involve two-wheeler falls, slides, and rollovers where bystanders fail to report quickly.
          </p>
        </div>

        <div className="bg-[#121A2E] border border-[#F59E0B]/40 p-6 rounded-xl space-y-2">
          <div className="text-4xl font-extrabold font-mono text-[#F59E0B]">15 Seconds</div>
          <div className="text-sm font-bold text-white">Operator Acknowledgment Window</div>
          <p className="text-xs text-[#8FA1C0]">
            Guarantees immediate human verification while preserving a failsafe automated telephony fallback if the operator is absent.
          </p>
        </div>

        <div className="bg-[#121A2E] border border-[#22C55E]/40 p-6 rounded-xl space-y-2">
          <div className="text-4xl font-extrabold font-mono text-[#22C55E]">0 Bytes DB</div>
          <div className="text-sm font-bold text-white">High-Speed In-Memory Core</div>
          <p className="text-xs text-[#8FA1C0]">
            Lightweight FastAPI and YOLOv8 pipeline built for 30 FPS inference on standard edge and cloud infrastructure.
          </p>
        </div>
      </div>

      <div className="bg-[#121A2E] border border-[#26335A] p-6 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-white text-center">4-Step Automated Emergency Pipeline</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-[#0A0F1C] border border-[#26335A] rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE] font-bold flex items-center justify-center font-mono">
              1
            </div>
            <div className="font-bold text-white text-sm">YOLOv8 Detection</div>
            <p className="text-[#8FA1C0]">
              Monitors MJPEG video feeds for motorcycle tumble, sudden velocity drop, and vehicle overlap with 85%+ confidence.
            </p>
          </div>

          <div className="p-4 bg-[#0A0F1C] border border-[#26335A] rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] font-bold flex items-center justify-center font-mono">
              2
            </div>
            <div className="font-bold text-white text-sm">WebSocket Alert</div>
            <p className="text-[#8FA1C0]">
              Instantly broadcasts <code className="text-[#22D3EE]">incident.created</code> payload to all connected ICCC operator consoles.
            </p>
          </div>

          <div className="p-4 bg-[#0A0F1C] border border-[#26335A] rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 text-[#EF4444] font-bold flex items-center justify-center font-mono">
              3
            </div>
            <div className="font-bold text-white text-sm">15s Decision Modal</div>
            <p className="text-[#8FA1C0]">
              Operator sees bounding box snapshot, GPS blackspot location, and can Acknowledge or Dispatch with keyboard hotkeys.
            </p>
          </div>

          <div className="p-4 bg-[#0A0F1C] border border-[#26335A] rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/20 text-[#22C55E] font-bold flex items-center justify-center font-mono">
              4
            </div>
            <div className="font-bold text-white text-sm">Twilio Voice Call</div>
            <p className="text-[#8FA1C0]">
              On 0s timeout, backend places automated bilingual Hindi/English voice dispatch call to 112 ERSS first responders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
