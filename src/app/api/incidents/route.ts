import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import type { Incident } from '../../../types';
import { ACCIDENT_PRESETS } from '../../../lib/mockData';
import { getAuthenticatedOperator, hasSameOrigin, supabaseRequest } from '../../../lib/supabase/server';

interface IncidentRow {
  id: string;
  status: Incident['status'];
  deadline_at: string;
  created_at: string;
  data: Incident;
}

function presentIncident(row: IncidentRow): Incident {
  const deadlineTs = new Date(row.deadline_at).getTime();
  return {
    ...row.data,
    id: row.id,
    status: row.status,
    deadlineTs,
    remainingSeconds: Math.max(0, Math.ceil((deadlineTs - Date.now()) / 1000)),
  };
}

export async function GET() {
  try {
    const operator = await getAuthenticatedOperator();
    if (!operator) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const rows = await supabaseRequest<IncidentRow[]>(
      operator,
      'incidents?select=id,status,deadline_at,created_at,data&order=created_at.desc',
    );
    return NextResponse.json({ incidents: rows.map(presentIncident) });
  } catch (error) {
    console.error('Failed to load incidents:', error);
    return NextResponse.json({ error: 'Unable to load incidents.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    const operator = await getAuthenticatedOperator();
    if (!operator) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json();
    const presetIndex = body.presetIndex;
    if (!Number.isInteger(presetIndex) || presetIndex < 0 || presetIndex >= ACCIDENT_PRESETS.length) {
      return NextResponse.json({ error: 'Invalid demo incident preset.' }, { status: 400 });
    }
    if (body.customLocation !== undefined && (typeof body.customLocation !== 'string' || body.customLocation.length > 180)) {
      return NextResponse.json({ error: 'Invalid incident location.' }, { status: 400 });
    }

    const preset = ACCIDENT_PRESETS[presetIndex];
    const now = new Date();
    const id = `INC-${randomUUID().slice(0, 8).toUpperCase()}`;
    const incident: Incident = {
      id,
      cameraId: preset.cameraId,
      cameraName: preset.cameraName,
      location: body.customLocation?.trim() || preset.location,
      coordinates: preset.coordinates,
      detectedAt: now.toISOString(),
      deadlineTs: 0,
      remainingSeconds: 0,
      severity: preset.severity,
      confidence: preset.confidence,
      status: 'AWAITING',
      vehicleType: preset.vehicleType,
      impactSpeed: preset.impactSpeed,
      snapshotUrl: preset.snapshotUrl,
      videoClipUrl: preset.videoClipUrl,
      boundingBoxes: [
        { x: 260, y: 150, width: 220, height: 140, label: preset.detectedVehicle, confidence: preset.confidence },
      ],
      timeline: [
        { time: now.toLocaleTimeString(), title: 'Demo incident created', description: `Camera ${preset.cameraId} reported ${preset.vehicleType}`, type: 'detection' },
        { time: now.toLocaleTimeString(), title: 'Operator alert created', description: 'Incident stored with a database-owned escalation deadline.', type: 'alert' },
      ],
    };

    const rows = await supabaseRequest<IncidentRow[]>(operator, 'rpc/create_incident', {
      method: 'POST',
      body: JSON.stringify({ p_id: id, p_data: incident }),
    });
    if (!rows[0]) throw new Error('Incident creation returned no row.');
    return NextResponse.json({ incident: presentIncident(rows[0]) }, { status: 201 });
  } catch (error) {
    console.error('Failed to create incident:', error);
    return NextResponse.json({ error: 'Unable to create incident.' }, { status: 500 });
  }
}
