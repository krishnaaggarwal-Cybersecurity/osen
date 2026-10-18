import React, { useEffect, useRef } from 'react';
import { BLACKSPOT_MARKERS } from '../../lib/mockData';
import type { Incident } from '../../types';

interface CommandMapProps {
  incidents: Incident[];
  onSelectIncident?: (incident: Incident) => void;
  height?: string;
}

export const CommandMapComponent: React.FC<CommandMapProps> = ({
  incidents,
  onSelectIncident,
  height = '320px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet on client side only to avoid SSR window error
    import('leaflet').then((L) => {
      if (!isMounted || !mapRef.current) return;

      if (!leafletInstance.current) {
        const map = L.map(mapRef.current, {
          center: [28.5355, 77.155],
          zoom: 11,
          zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        leafletInstance.current = map;
      }

      const map = leafletInstance.current;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });

      BLACKSPOT_MARKERS.forEach((bs) => {
        const circle = L.circle([bs.lat, bs.lng], {
          color: '#0B7FF5',
          fillColor: '#0B7FF5',
          fillOpacity: 0.15,
          radius: 450,
        }).addTo(map);

        circle.bindTooltip(
          `<div style="font-family:sans-serif; color:#0F172A; background:#FFFFFF; border:1px solid #E2E8F0; padding:6px; border-radius:6px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
            <strong>📍 ${bs.name}</strong><br/>
            <span style="font-size:11px; color:#0B7FF5; font-weight:bold;">Blackspot Risk: ${bs.riskLevel} (${bs.incidentCount} past incidents)</span>
          </div>`,
          { direction: 'top', sticky: true }
        );
      });

      incidents.forEach((inc) => {
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="
            width: 24px;
            height: 24px;
            background-color: #0B7FF5;
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(11, 127, 245, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            color: white;
          ">!</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], {
          icon: customIcon,
        }).addTo(map);

        marker.bindTooltip(
          `<div style="font-family:sans-serif; color:#0F172A; background:#FFFFFF; border:1px solid #0B7FF5; padding:8px; border-radius:6px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
            <strong style="color:#0B7FF5;">${inc.id}: ${inc.severity}</strong><br/>
            <span>${inc.location}</span><br/>
            <span style="font-size:10px; color:#64748B; font-weight:bold;">Status: ${inc.status}</span>
          </div>`,
          { direction: 'top' }
        );

        marker.on('click', () => {
          if (onSelectIncident) {
            onSelectIncident(inc);
          }
        });
      });
    });

    return () => {
      isMounted = false;
    };
  }, [incidents, onSelectIncident]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs">
      <div ref={mapRef} style={{ height }} className="w-full z-10" />
      <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#0B7FF5] flex items-center space-x-2 shadow-xs font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0B7FF5] animate-pulse" />
        <span>Leaflet GIS Blackspot Map</span>
      </div>
    </div>
  );
};
