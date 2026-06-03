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
import { fetchAuthSession, getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useEffect } from "react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Background S3 upload states
  const [s3UploadStatus, setS3UploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        setIsCheckingAuth(false);
      } catch {
        router.push("/auth");
      }
    };
    checkUser();
  }, [router]);

  const uploadFileToS3 = async (selectedFile: File) => {
    setS3UploadStatus("uploading");
    setErrorMsg("");
    setProgress("Uploading video file...");

    try {
      // Step A: Request presigned URL
      const presignRes = await fetch(`${API_BASE_URL}/upload-url`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileName: selectedFile.name }),
      });

      if (!presignRes.ok) {
        const errBody = await presignRes.json().catch(() => ({}));
        throw new Error(errBody.detail || errBody.error || `Failed to get upload URL`);
      }

      const { uploadUrl, fileName } = await presignRes.json();

      // Step B: Upload file directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "video/mp4",
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error(`File upload failed (${uploadRes.status})`);
      }

      const finalVideoUrl = stripQueryParams(uploadUrl);
      setUploadedUrl(finalVideoUrl);
      setUploadedFileName(fileName);
      setS3UploadStatus("success");
      setProgress("Upload complete!");
    } catch (err) {
      console.error("S3 upload error:", err);
      setS3UploadStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "S3 upload failed.");
      setProgress("");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      uploadFileToS3(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      setFile(selected);
      uploadFileToS3(selected);
    }
  };

  const removeFile = () => {
    setFile(null);
    setS3UploadStatus("idle");
    setUploadedUrl("");
    setUploadedFileName("");
    setProgress("");
    setErrorMsg("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadedUrl || !uploadedFileName || !title.trim()) return;

    setStatus("uploading");
    setErrorMsg("");
    setProgress("Saving video metadata...");

    try {
      // Fetch user attributes from Cognito
      let creatorName = "DOSHUB Creator";
      let uploaderEmail = "unknown";
      try {
        const userAttrs = await fetchUserAttributes();
        creatorName = userAttrs.name || userAttrs.email?.split("@")[0] || "DOSHUB Creator";
        uploaderEmail = userAttrs.email || "unknown";
      } catch (authErr) {
        console.error("Failed to fetch user attributes, using fallback", authErr);
      }

      const saveBody = {
        video_id: uploadedFileName, // format snake_case
        videoId: uploadedFileName,  // format camelCase (fallback)
        title: title.trim(),
        video_url: uploadedUrl,
        videoUrl: uploadedUrl,
        creator: creatorName,
        uploader: uploaderEmail,
      };
      
      const saveRes = await fetch(`${API_BASE_URL}/save-video`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(saveBody),
      });

      if (!saveRes.ok) {
        const saveErr = await saveRes.json().catch(() => ({}));
        console.error("[Step C] Save-video failed:", saveErr);
        throw new Error(saveErr.error || "Failed to save video information to database.");
      }

      console.log("[Step C] Metadata saved successfully");
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

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="bg-green-50 dark:bg-green-900/30 rounded-full p-4 w-fit mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Successful!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
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
              className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-full p-4 w-fit mx-auto mb-3">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Video</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Share your video with the DOSHUB community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title Input */}
          <div>
            <label
              htmlFor="video-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
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
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white dark:focus:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 transition disabled:opacity-50"
            />
          </div>

          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Video File
            </label>
            {!file ? (
              <label
                htmlFor="video-file"
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="upload-zone flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:dark:bg-gray-800"
              >
                <FileVideo className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="text-blue-600 dark:text-blue-500 font-medium">Click to browse</span>{" "}
                  or drag a file
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  MP4, WebM — Max 500MB
                </p>
                <input
                  id="video-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.webm,video/mp4,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={status === "uploading" || s3UploadStatus === "uploading"}
                />
              </label>
            ) : (
              <div className={`flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl transition-all duration-300 ${
                s3UploadStatus === "uploading" ? "upload-loading-border" : ""
              }`}>
                <FileVideo className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {file.name}
                  </p>
                  {s3UploadStatus === "uploading" ? (
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mt-0.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading to S3...</span>
                    </p>
                  ) : s3UploadStatus === "success" ? (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 font-medium flex items-center gap-1">
                      <span>✓ Upload complete! Ready to publish.</span>
                    </p>
                  ) : s3UploadStatus === "error" ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-medium">
                      Upload failed. Please try again.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </div>
                {status !== "uploading" && s3UploadStatus !== "uploading" && (
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {(status === "error" || (s3UploadStatus === "error" && errorMsg)) && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!file || !title.trim() || s3UploadStatus !== "success" || status === "uploading"}
            className={`w-full flex items-center justify-center gap-2 py-3 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] ${
              (!file || !title.trim() || s3UploadStatus !== "success" || status === "uploading")
                ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-200 dark:hover:shadow-none cursor-pointer"
            }`}
          >
            {s3UploadStatus === "uploading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading file to S3...</span>
              </>
            ) : status === "uploading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Publishing video...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Publish Video</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
