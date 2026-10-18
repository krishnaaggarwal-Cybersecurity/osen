export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus = 'DETECTED' | 'AWAITING' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'DISMISSED' | 'AUTO-ESCALATED' | 'CALLING' | 'RESOLVED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface IncidentTimelineEvent {
  time: string;
  title: string;
  description: string;
  type: 'detection' | 'alert' | 'acknowledgement' | 'dispatch' | 'dismissal' | 'telephony' | 'system';
}

export interface Incident {
  id: string;
  cameraId: string;
  cameraName: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  detectedAt: string;
  deadlineTs: number; // UNIX timestamp in ms
  remainingSeconds: number;
  severity: SeverityLevel;
  confidence: number;
  status: IncidentStatus;
  vehicleType: string;
  impactSpeed: string;
  snapshotUrl: string;
  videoClipUrl: string;
  boundingBoxes: BoundingBox[];
  timeline: IncidentTimelineEvent[];
  dispatchDetails?: {
    responder: string;
    phone: string;
    callSid?: string;
    language: string;
    callDuration?: number;
    callStatus: 'queued' | 'ringing' | 'answered' | 'completed' | 'failed';
  };
}

export interface DemoClip {
  id: string;
  title: string;
  location: string;
  duration: string;
  expectedTriggerTime: string;
  thumbnail: string;
  videoUrl: string;
  description: string;
}

export interface SystemHealth {
  backend: boolean;
  model: boolean;
  twilio: boolean;
  fps: number;
  latencyMs: number;
  objectsDetected: number;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  type: 'ws' | 'api' | 'telephony' | 'model' | 'action';
  message: string;
  payload?: any;
}
