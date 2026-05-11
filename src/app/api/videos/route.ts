import { NextResponse } from "next/server";

const AWS_API = process.env.AWS_API_URL || "";

export async function GET() {
  try {
    const res = await fetch(`${AWS_API}/videos`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `AWS API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Map 'video_id' from backend to 'videoId' for the frontend
    if (data.videos && Array.isArray(data.videos)) {
      data.videos = data.videos.map((v: any) => ({
        ...v,
        videoId: v.video_id || v.videoId,
      }));
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy /api/videos error:", err);
    return NextResponse.json(
      { error: "Failed to fetch videos from backend" },
      { status: 502 }
    );
  }
}
