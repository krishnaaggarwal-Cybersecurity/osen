import React, { useEffect, useState } from 'react';
import { CAMERA_LIST } from '../lib/mockData';
import { Camera, Video, Film } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CamerasPage: React.FC = () => {
  const { activeClip } = useApp();
  const [cctvFeeds, setCctvFeeds] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = 'Cameras | NetraGridAI';

    const checkCctv = async () => {
      try {
        const res = await fetch('/api/cctv');
        const data = await res.json();
        if (data.success && data.cameraFeeds) {
          setCctvFeeds(data.cameraFeeds);
        }
      } catch {
        // ignore
      }
    };
    checkCctv();
    const interval = setInterval(checkCctv, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Camera className="w-5 h-5 text-[#0B7FF5]" />
            <span>Camera Feeds & Sensor Grid</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time CCTV stream health, resolution, FPS latency, and active video streams across 3 primary corridor cameras.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-mono text-xs text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg flex items-center space-x-1">
            <Film className="w-3.5 h-3.5 text-[#0B7FF5]" />
            <span>Folder: /cctv_footage/</span>
          </span>
          <span className="font-mono text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg font-bold">
            3 / 3 Cameras Streaming
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CAMERA_LIST.map((cam) => {
          const isSelected = activeClip.id.includes(cam.id.toLowerCase());
          const videoSrc = cctvFeeds[cam.id] || cam.videoUrl;

          return (
            <div
              key={cam.id}
              className={`bg-white border rounded-xl overflow-hidden space-y-3 transition-calm shadow-xs ${
                isSelected ? 'border-[#0B7FF5] ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 font-mono">{cam.name}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    cam.status === 'ONLINE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  {cam.status}
                </span>
              </div>

              <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
                {cam.isStreaming ? (
                  <video
                    src={videoSrc}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== cam.fallbackVideoUrl) {
                        target.src = cam.fallbackVideoUrl;
                      }
                    }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-1">
                    <Video className="w-8 h-8 mx-auto opacity-40" />
                    <span className="text-xs block font-mono">FEED DISCONNECTED</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Location:</span>
                  <span className="text-slate-900 font-bold">{cam.location}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                  <span>Resolution / FPS:</span>
                  <span className="text-[#0B7FF5] font-bold">{cam.resolution} @ {cam.fps} FPS</span>
                </div>
                <div className="flex justify-between text-slate-400 font-mono text-[10px] pt-1 border-t border-slate-100">
                  <span>CCTV Source:</span>
                  <span className="text-slate-600 truncate max-w-[180px]">/cctv_footage/{cam.cctvFilename}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
