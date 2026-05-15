import { NextRequest, NextResponse } from "next/server";

const AWS_API = process.env.AWS_API_URL || "";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[video-delete] Proxying body to AWS:", JSON.stringify(body, null, 2));

    const videoId = body.video_id || body.videoId;
    const fileName = body.file_name || body.fileName;

    if (!videoId || !fileName) {
      return NextResponse.json(
        { error: "Missing video_id or file_name" },
        { status: 400 }
      );
    }

    const res = await fetch(`${AWS_API}/video`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    const responseText = await res.text();
    console.log(`[video-delete] AWS status: ${res.status}, response:`, responseText);
    console.log(`[video-delete] AWS status: ${res.status}, response:`, responseText);

    if (!res.ok) {
      return NextResponse.json(
        { error: `AWS API returned ${res.status}`, detail: responseText },
        { status: res.status }
      );
    }

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ message: responseText });
    }
  } catch (err) {
    console.error("Proxy DELETE /api/video error:", err);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 502 }
    );
  }
}
