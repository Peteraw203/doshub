"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { Video, VideosResponse } from "@/types";
import { timeAgo, API_BASE_URL } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

// Levenshtein distance implementation for typo tolerance
function levenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  let i: number, j: number;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

// Score closest matches
function getSearchScore(title: string, query: string): number {
  if (!query) return 1;

  const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const titleTokens = title.toLowerCase().split(/\s+/).filter(Boolean);

  if (queryTokens.length === 0) return 1;

  let score = 0;

  for (const qToken of queryTokens) {
    for (const tToken of titleTokens) {
      if (tToken === qToken) {
        score += 10; // Exact word match
      } else if (tToken.includes(qToken)) {
        score += 5; // Partial word match
      } else if (qToken.includes(tToken)) {
        score += 3; // Title word inside query
      } else {
        const distance = levenshteinDistance(qToken, tToken);
        const maxLen = Math.max(qToken.length, tToken.length);
        if (distance <= 2 && maxLen > 3) {
          score += (maxLen - distance) / maxLen; // Typo match
        }
      }
    }
  }

  return score;
}

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

function HomePageContent() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

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

  // Filter and sort by closest match scores
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) {
      return videos;
    }

    const trimmedQuery = searchQuery.trim();
    return videos
      .map((video) => ({
        video,
        score: getSearchScore(video.title || "", trimmedQuery),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.video);
  }, [videos, searchQuery]);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {searchQuery ? "Search Results" : "Trending Now"}
        </h1>
        {searchQuery && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Displaying closest matches for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-6 text-center max-w-md">
            <p className="text-red-600 dark:text-red-400 font-medium">Oops! Something went wrong</p>
            <p className="text-red-400 dark:text-red-300 text-sm mt-1">{error}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty Database State */}
      {!loading && !error && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-full p-6 mb-4">
            <Play className="w-12 h-12 text-blue-400 dark:text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">No videos yet</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Be the first one to{" "}
            <Link href="/upload" className="text-blue-600 hover:underline">
              upload a video
            </Link>
            !
          </p>
        </div>
      )}

      {/* Empty Search Matches State */}
      {!loading && !error && videos.length > 0 && filteredVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-full p-6 mb-4">
            <Play className="w-12 h-12 text-blue-400 dark:text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">No matching videos</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Try checking your spelling or search for something else!
          </p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && !error && filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Link
              key={video.videoId}
              href={`/video/${video.videoId}`}
              className="video-card group rounded-2xl overflow-hidden transition-all duration-300 bg-transparent"
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
                  {(video.creator || "DOSHUB Creator").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {video.title || "Untitled Video"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.creator || "DOSHUB Creator"}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
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

export default function HomePage() {
  return (
    <Suspense fallback={
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Trending Now
          </h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}

/*deployment 3*/
