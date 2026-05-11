import { NextRequest, NextResponse } from "next/server";

const AWS_API = process.env.AWS_API_URL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${AWS_API}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `AWS API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy /api/like error:", err);
    return NextResponse.json(
      { error: "Failed to like video" },
      { status: 502 }
    );
  }
}
