import type { Incident, DemoClip } from '../types';

export const ACCIDENT_SNAPSHOT_IMAGES = [
  '/accidents/accident_collision_01.jpg',
  '/accidents/accident_conflict_02.png',
  '/accidents/accident_conflict_03.png',
  '/accidents/accident_conflict_04.png',
];

export const ACCIDENT_PRESETS = [
  {
    cameraId: 'CAM-01',
    cameraName: 'CAM-01 NH-48 Km 112',
    location: 'Gurugram NH-48 Express Corridor (Km 112.4)',
    coordinates: { lat: 28.4595, lng: 77.0266 },
    severity: 'CRITICAL' as const,
    confidence: 0.94,
    vehicleType: 'Multi-Vehicle Collision & Rollover',
    impactSpeed: '64 km/h sudden velocity drop',
    snapshotUrl: '/accidents/accident_collision_01.jpg',
    videoClipUrl: '/cctv_footage/camera_1.mp4',
    fallbackVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-highway-at-night-41549-large.mp4',
    detectedVehicle: 'White Sedan / Truck Impact',
  },
  {
    cameraId: 'CAM-02',
    cameraName: 'CAM-02 CP Radial Road 3',
    location: 'Connaught Place Outer Radial, New Delhi',
    coordinates: { lat: 28.6315, lng: 77.2167 },
    severity: 'HIGH' as const,
    confidence: 0.89,
    vehicleType: 'V2V Trajectory Conflict (Crossing)',
    impactSpeed: '22 mph vs 4 mph conflict',
    snapshotUrl: '/accidents/accident_conflict_02.png',
    videoClipUrl: '/cctv_footage/camera_2.mp4',
    fallbackVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-night-traffic-in-a-big-city-4340-large.mp4',
    detectedVehicle: 'Car Trajectory Overlap',
  },
  {
    cameraId: 'CAM-03',
    cameraName: 'CAM-03 AIIMS Flyover',
    location: 'AIIMS Flyover Slip Road, Ring Road Blackspot',
    coordinates: { lat: 28.5672, lng: 77.2100 },
    severity: 'CRITICAL' as const,
    confidence: 0.95,
    vehicleType: 'V2V Angular Collision Course',
    impactSpeed: '9 mph vs 8 mph junction intercept',
    snapshotUrl: '/accidents/accident_conflict_03.png',
    videoClipUrl: '/cctv_footage/camera_3.mp4',
    fallbackVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4',
    detectedVehicle: 'Vehicle Vector Collision',
  },
];

export const INITIAL_DEMO_CLIPS: DemoClip[] = [
  {
    id: 'clip_highway_01',
    title: 'CAM-01 NH-48 Km 112 - Collision Feed',
    location: 'Gurugram NH-48 Express Corridor',
    duration: '00:45',
    expectedTriggerTime: '00:08',
    thumbnail: '/accidents/accident_collision_01.jpg',
    videoUrl: '/cctv_footage/camera_1.mp4',
    description: 'High-speed multi-car impact and rollover across lane 2. 94% confidence crash.',
  },
  {
    id: 'clip_junction_02',
    title: 'CAM-02 Connaught Place - Trajectory Conflict',
    location: 'New Delhi Junction 04',
    duration: '01:10',
    expectedTriggerTime: '00:15',
    thumbnail: '/accidents/accident_conflict_02.png',
    videoUrl: '/cctv_footage/camera_2.mp4',
    description: 'Lateral impact trajectory conflict at signal crossing with vector prediction.',
  },
  {
    id: 'clip_blackspot_03',
    title: 'CAM-03 AIIMS Flyover - Angular Conflict',
    location: 'AIIMS Flyover Slip Road, Delhi',
    duration: '00:30',
    expectedTriggerTime: '00:05',
    thumbnail: '/accidents/accident_conflict_03.png',
    videoUrl: '/cctv_footage/camera_3.mp4',
    description: 'Pre-recorded crash clip for stage demo. Instant zero-delay YOLO detection trigger.',
  },
];

// Empty initial incidents list (no pre-populated active incidents)
export const INITIAL_INCIDENTS: Incident[] = [];

export const BLACKSPOT_MARKERS = [
  { id: 'bs-01', name: 'NH-48 Km 112 Curve', lat: 28.4595, lng: 77.0266, incidentCount: 14, riskLevel: 'HIGH' },
  { id: 'bs-02', name: 'Connaught Place Outer Radial', lat: 28.6315, lng: 77.2167, incidentCount: 9, riskLevel: 'MEDIUM' },
  { id: 'bs-03', name: 'AIIMS Flyover Slip Road', lat: 28.5672, lng: 77.2100, incidentCount: 22, riskLevel: 'CRITICAL' },
];

export interface CameraInfo {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  fps: number;
  resolution: string;
  location: string;
  isStreaming: boolean;
  videoUrl: string;
  fallbackVideoUrl: string;
  cctvFilename: string;
}

// Exactly 3 cameras configured with dedicated cctv_footage paths
export const CAMERA_LIST: CameraInfo[] = [
  {
    id: 'CAM-01',
    name: 'CAM-01 NH-48 Km 112',
    status: 'ONLINE',
    fps: 30,
    resolution: '1080p',
    location: 'Gurugram NH-48 Express Corridor',
    isStreaming: true,
    videoUrl: '/cctv_footage/camera_1.mp4',
    fallbackVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-highway-at-night-41549-large.mp4',
    cctvFilename: 'camera_1.mp4',
  },
  {
    id: 'CAM-02',
    name: 'CAM-02 CP Radial Road 3',
    status: 'ONLINE',
    fps: 25,
    resolution: '1080p',
    location: 'Connaught Place Outer Radial',
    isStreaming: true,
    videoUrl: '/cctv_footage/camera_2.mp4',
    fallbackVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-night-traffic-in-a-big-city-4340-large.mp4',
    cctvFilename: 'camera_2.mp4',
  },
  {
    id: 'CAM-03',
    name: 'CAM-03 AIIMS Flyover',
    status: 'ONLINE',
    fps: 30,
    resolution: '4K',
    location: 'AIIMS Flyover Slip Road',
    isStreaming: true,
    videoUrl: '/cctv_footage/camera_3.mp4',
    fallbackVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-41551-large.mp4',
    cctvFilename: 'camera_3.mp4',
  },
];
