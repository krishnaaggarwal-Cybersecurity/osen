import { NextResponse } from 'next/server';
import { INITIAL_DEMO_CLIPS } from '../../../lib/mockData';

export async function GET() {
  return NextResponse.json({
    success: true,
    streams: INITIAL_DEMO_CLIPS,
    activeStream: INITIAL_DEMO_CLIPS[0],
    fps: 29.8,
    latencyMs: 42,
  });
}
