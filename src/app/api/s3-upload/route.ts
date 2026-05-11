import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies the file upload to the S3 presigned URL from the server side.
 * This avoids any CORS issues with direct browser-to-S3 uploads.
 *
 * Expects: multipart form data with fields:
 *  - uploadUrl: the presigned S3 URL
 *  - file: the video file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadUrl = formData.get("uploadUrl") as string;
    const file = formData.get("file") as File;

    if (!uploadUrl || !file) {
      return NextResponse.json(
        { error: "Missing uploadUrl or file" },
        { status: 400 }
      );
    }

    console.log(`[s3-upload] Uploading file "${file.name}" (${file.size} bytes) to S3...`);

    // Read file as ArrayBuffer and PUT to S3
    const fileBuffer = await file.arrayBuffer();

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "video/mp4",
      },
      body: fileBuffer,
    });

    console.log(`[s3-upload] S3 response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[s3-upload] S3 error:`, errorText);
      return NextResponse.json(
        { error: `S3 upload failed with status ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[s3-upload] Error:", err);
    return NextResponse.json(
      { error: "Failed to upload file to S3" },
      { status: 502 }
    );
  }
}

// Allow large file uploads (500MB)
export const config = {
  api: {
    bodyParser: false,
  },
};
