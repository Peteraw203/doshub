"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Flame } from "lucide-react";
import { Video, VideosResponse } from "@/types";
import { timeAgo, API_BASE_URL } from "@/lib/utils";

function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="skeleton w-full" style={{ paddingBottom: "56.25%" }} />
      <div className="flex gap-3">
        <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setError(
          err instanceof Error ? err.message : "Failed to load videos."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Flame className="w-6 h-6 text-blue-600" />
          Trending Now
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Discover the latest videos from creators
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
            <p className="text-red-600 font-medium">Oops! Something went wrong</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-blue-50 rounded-full p-6 mb-4">
            <Play className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700">No videos yet</h2>
          <p className="text-sm text-gray-400 mt-1">
            Be the first one to{" "}
            <Link href="/upload" className="text-blue-600 hover:underline">
              upload a video
            </Link>
            !
          </p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && !error && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map((video) => (
            <Link
              key={video.videoId}
              href={`/video/${video.videoId}`}
              className="video-card group rounded-xl overflow-hidden bg-white border border-gray-100"
            >
              {/* Thumbnail */}
              <div className="thumbnail-container rounded-t-xl">
                {video.videoUrl ? (
                  <video
                    src={video.videoUrl}
                    muted
                    preload="metadata"
                    className="group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                    <Play className="w-10 h-10 text-gray-500" />
                  </div>
                )}
                {/* Hover play icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-3">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 flex gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {video.title?.charAt(0)?.toUpperCase() || "V"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                    {video.title || "Untitled Video"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">DOSHUB Creator</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                    <span>{video.likes ?? 0} likes</span>
                    <span>•</span>
                    <span>{timeAgo(video.uploadTime)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
