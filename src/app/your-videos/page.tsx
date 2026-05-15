"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Trash2, Film, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Video, VideosResponse } from "@/types";
import { timeAgo, API_BASE_URL } from "@/lib/utils";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

export default function YourVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        setIsCheckingAuth(false);
        fetchVideos();
      } catch {
        router.push("/auth");
      }
    };
    checkUser();
  }, [router]);

  async function fetchVideos() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/videos`);
      if (!res.ok) throw new Error(`Failed to fetch videos (${res.status})`);
      const data: VideosResponse = await res.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos.");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (video: Video) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    setDeletingId(video.videoId);
    setError(null);
    setSuccessMsg(null);

    try {
      // Extract fileName from URL more reliably
      let fileName = "";
      try {
        const urlObj = new URL(video.videoUrl);
        // Get the last part of the path and remove any query params
        fileName = urlObj.pathname.split("/").pop() || "";
      } catch {
        // Fallback: try manual split if URL is weird
        fileName = video.videoUrl.split("/").pop()?.split("?")[0] || "";
      }

      if (!fileName) {
        throw new Error("Could not determine file name for deletion.");
      }

      console.log(`[Delete Debug] Attempting to delete: videoId=${video.videoId}, fileName=${fileName}`);

      const res = await fetch(`${API_BASE_URL}/video`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          videoId: video.videoId, // Must match Lambda's 'videoId'
          fileName: fileName      // Must match Lambda's 'fileName'
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[Delete Debug] Error details:", errData);
        throw new Error(errData.detail || errData.error || `Delete failed (${res.status})`);
      }

      setSuccessMsg(`Video "${video.title}" deleted successfully.`);
      // Refresh list
      setVideos((prev) => prev.filter((v) => v.videoId !== video.videoId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete video.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Film className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            Your Videos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your uploaded content and track performance
          </p>
        </div>
        <Link
          href="/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-blue-200 dark:shadow-none inline-flex items-center justify-center gap-2"
        >
          Upload New Video
        </Link>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl text-green-700 dark:text-green-400 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl mb-4" />
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Film className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No videos found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
            You haven&apos;t uploaded any videos yet. Start sharing your content with the world today!
          </p>
          <Link
            href="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all inline-block"
          >
            Upload your first video
          </Link>
        </div>
      )}

      {/* Video List */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          <div className="hidden md:grid grid-cols-12 px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-6">Video</div>
            <div className="col-span-2 text-center">Stats</div>
            <div className="col-span-2 text-center">Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.videoId}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 md:p-5 transition-all hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-0.5"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 md:gap-6">
                  {/* Thumbnail & Info */}
                  <div className="col-span-1 md:col-span-6 flex items-center gap-4">
                    <div className="relative w-32 md:w-40 aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 group-hover:ring-2 ring-blue-500 transition-all">
                      {video.videoUrl ? (
                        <video src={video.videoUrl} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Link href={`/video/${video.videoId}`} className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-blue-600 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                          <Play className="w-5 h-5 fill-current" />
                        </Link>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                        Public • Video ID: {video.videoId.substring(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="col-span-1 md:col-span-2 text-center border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="flex flex-row md:flex-col justify-around md:justify-center items-center gap-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{video.likes || 0}</span>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Likes</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-1 md:col-span-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="md:block">{new Date(video.uploadTime).toLocaleDateString()}</span>
                    <span className="md:block md:mt-1 opacity-70">{timeAgo(video.uploadTime)}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                    <Link
                      href={`/video/${video.videoId}`}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                    >
                      <Play className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(video)}
                      disabled={deletingId === video.videoId}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      {deletingId === video.videoId ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
