import { NextRequest, NextResponse } from "next/server";

const AWS_API = process.env.AWS_API_URL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[save-video] Request body:", JSON.stringify(body, null, 2));

    const res = await fetch(`${AWS_API}/save-video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Read the raw response text for debugging
    const responseText = await res.text();
    console.log(`[save-video] AWS status: ${res.status}, response:`, responseText);

    if (!res.ok) {
      return NextResponse.json(
        { error: `AWS API returned ${res.status}`, detail: responseText },
        { status: res.status }
      );
    }

    // Try to parse as JSON, fallback to raw text
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ message: responseText });
    }
  } catch (err) {
    console.error("Proxy /api/save-video error:", err);
    return NextResponse.json(
      { error: "Failed to save video metadata" },
      { status: 502 }
    );
  }
}
