import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const cctvDir = path.join(process.cwd(), 'public', 'cctv_footage');
    if (!fs.existsSync(cctvDir)) {
      fs.mkdirSync(cctvDir, { recursive: true });
    }

    const allFiles = fs.readdirSync(cctvDir);
    const videoFiles = allFiles.filter((f) =>
      /\.(mp4|webm|mov|mkv)$/i.test(f)
    );

    // Map files intelligently to the 3 cameras
    const cameraMap: Record<string, string> = {};

    videoFiles.forEach((file) => {
      const lower = file.toLowerCase();
      if (lower.includes('1') || lower.includes('cam-01') || lower.includes('cam01') || lower.includes('cam-07')) {
        cameraMap['CAM-01'] = `/cctv_footage/${file}`;
      } else if (lower.includes('2') || lower.includes('cam-02') || lower.includes('cam02') || lower.includes('cam-04')) {
        cameraMap['CAM-02'] = `/cctv_footage/${file}`;
      } else if (lower.includes('3') || lower.includes('cam-03') || lower.includes('cam03') || lower.includes('cam-12')) {
        cameraMap['CAM-03'] = `/cctv_footage/${file}`;
      }
    });

    // Fallback: assign sequentially if not matched by name
    if (!cameraMap['CAM-01'] && videoFiles[0]) {
      cameraMap['CAM-01'] = `/cctv_footage/${videoFiles[0]}`;
    }
    if (!cameraMap['CAM-02'] && videoFiles[1]) {
      cameraMap['CAM-02'] = `/cctv_footage/${videoFiles[1]}`;
    }
    if (!cameraMap['CAM-03'] && videoFiles[2]) {
      cameraMap['CAM-03'] = `/cctv_footage/${videoFiles[2]}`;
    }

    return NextResponse.json({
      success: true,
      directory: 'public/cctv_footage',
      uploadedCount: videoFiles.length,
      files: videoFiles,
      cameraFeeds: cameraMap,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    });
  }
}
