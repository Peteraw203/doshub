import { NextRequest, NextResponse } from "next/server";

const AWS_API = process.env.AWS_API_URL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[upload-url] Request body:", JSON.stringify(body));

    const res = await fetch(`${AWS_API}/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const responseText = await res.text();
    console.log(`[upload-url] AWS status: ${res.status}, response:`, responseText);

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
    console.error("Proxy /api/upload-url error:", err);
    return NextResponse.json(
      { error: "Failed to get upload URL" },
      { status: 502 }
    );
  }
}
