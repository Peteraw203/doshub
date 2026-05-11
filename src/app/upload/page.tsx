"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileVideo,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { API_BASE_URL, stripQueryParams } from "@/lib/utils";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setStatus("uploading");
    setErrorMsg("");

    try {
      // Step A: Request presigned URL
      setProgress("Requesting upload URL...");
      const presignRes = await fetch(`${API_BASE_URL}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!presignRes.ok) {
        throw new Error(`Failed to get upload URL (${presignRes.status})`);
      }

      const presignData = await presignRes.json();
      const { uploadUrl, fileName } = presignData;
      console.log("[Step A] Presigned URL response:", presignData);

      // Step B: Upload file to S3 via server-side proxy (avoids CORS)
      setProgress("Uploading video file...");
      const formData = new FormData();
      formData.append("uploadUrl", uploadUrl);
      formData.append("file", file);

      const uploadRes = await fetch(`${API_BASE_URL}/s3-upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        console.error("[Step B] S3 upload failed:", uploadErr);
        throw new Error(`File upload failed (${uploadRes.status})`);
      }
      console.log("[Step B] S3 upload succeeded");

      // Step C: Save video metadata to database
      setProgress("Saving video metadata...");
      const videoUrl = stripQueryParams(uploadUrl);
      const saveBody = {
        videoId: fileName,
        title: title.trim(),
        videoUrl: videoUrl,
      };
      console.log("[Step C] Saving metadata with body:", saveBody);

      try {
        const saveRes = await fetch(`${API_BASE_URL}/save-video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveBody),
        });

        if (!saveRes.ok) {
          const saveErr = await saveRes.json().catch(() => ({}));
          console.warn("[Step C] Save-video returned non-200, but file is in S3:", saveErr);
        } else {
          console.log("[Step C] Metadata saved successfully");
        }
      } catch (saveError) {
        console.warn("[Step C] Save-video request failed, but file is in S3:", saveError);
      }

      setStatus("success");
      setProgress("");
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
      setProgress("");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="bg-green-50 rounded-full p-4 w-fit mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upload Successful!
          </h2>
          <p className="text-gray-500 mb-6">
            Your video <strong>&quot;{title}&quot;</strong> has been uploaded
            and is now processing.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200"
            >
              Go Home
            </button>
            <button
              onClick={() => {
                setStatus("idle");
                setTitle("");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition"
            >
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-50 rounded-full p-4 w-fit mx-auto mb-3">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Video</h1>
          <p className="text-sm text-gray-500 mt-1">
            Share your video with the DOSHUB community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title Input */}
          <div>
            <label
              htmlFor="video-title"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Video Title
            </label>
            <input
              id="video-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              required
              disabled={status === "uploading"}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white placeholder-gray-400 transition disabled:opacity-50"
            />
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Video File
            </label>
            {!file ? (
              <label
                htmlFor="video-file"
                className="upload-zone flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50"
              >
                <FileVideo className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="text-blue-600 font-medium">Click to browse</span>{" "}
                  or drag a file
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  MP4, WebM — Max 500MB
                </p>
                <input
                  id="video-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.webm,video/mp4,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={status === "uploading"}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <FileVideo className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {status !== "uploading" && (
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 rounded-full hover:bg-blue-100 transition"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {status === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || !title.trim() || status === "uploading"}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-[0.98]"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{progress || "Uploading..."}</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload Video</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
