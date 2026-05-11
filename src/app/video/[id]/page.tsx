"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Menggunakan useParams agar aman di Next.js terbaru
import { ThumbsUp, Share2, AlertCircle } from "lucide-react";
import { Video, VideosResponse } from "@/types";
import { timeAgo, API_BASE_URL } from "@/lib/utils";

export default function VideoPlayerPage() {
  const params = useParams();
  // Decode URL jika nama file mengandung spasi atau karakter aneh
  const videoId = decodeURIComponent(params.id as string || params.videoId as string);

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likes, setLikes] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    async function fetchVideoDetail() {
      if (!videoId) return;

      try {
        setLoading(true);
        // Kita panggil semua video dari API
        const res = await fetch(`${API_BASE_URL}/videos`);
        if (!res.ok) throw new Error("Gagal mengambil data dari server");

        const data: VideosResponse = await res.json();

        // Kita cari video yang ID-nya sama persis dengan yang ada di URL
        const foundVideo = data.videos?.find((v) => v.videoId === videoId);

        if (!foundVideo) {
          throw new Error("Video not found");
        }

        setVideo(foundVideo);
        setLikes(foundVideo.likes || 0);
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Video tidak ditemukan");
      } finally {
        setLoading(false);
      }
    }

    fetchVideoDetail();
  }, [videoId]);

  const handleLike = async () => {
    if (!video || isLiking) return;

    // Optimistic UI Update (Langsung tambah angka di layar biar terasa cepat)
    setLikes((prev) => prev + 1);
    setIsLiking(true);

    try {
      const res = await fetch(`${API_BASE_URL}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.videoId }),
      });

      if (!res.ok) {
        throw new Error("Gagal like video");
      }
    } catch (err) {
      console.error(err);
      // Kalau API gagal, kembalikan angkanya
      setLikes((prev) => prev - 1);
      alert("Gagal menambahkan like. Coba lagi.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title || "Video di DOSHUB",
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share dibatalkan", err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link video berhasil disalin ke clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col animate-pulse gap-4 max-w-5xl mx-auto">
        <div className="w-full aspect-video bg-gray-200 rounded-xl" />
        <div className="h-6 bg-gray-200 w-1/2 rounded" />
        <div className="h-4 bg-gray-200 w-1/4 rounded" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Oops!</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      {/* KIRI: Video Player Utama (70%) */}
      <div className="w-full lg:w-[70%] flex flex-col gap-4">
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-gray-100">
          <video
            src={video.videoUrl}
            controls
            autoPlay
            className="w-full h-full"
          />
        </div>

        {/* Info Video */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {video.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-4">
            {/* Creator Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                {video.title?.charAt(0)?.toUpperCase() || "D"}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">DOSHUB Creator</h3>
                <p className="text-xs text-gray-500">
                  {video.uploadTime ? timeAgo(video.uploadTime) : "Baru saja"}
                </p>
              </div>
            </div>

            {/* Aksi: Like & Share */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition disabled:opacity-50"
              >
                <ThumbsUp className={`w-4 h-4 ${isLiking ? "text-blue-600 fill-blue-600" : ""}`} />
                {likes}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: Rekomendasi (30% - Placeholder) */}
      <div className="w-full lg:w-[30%]">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Video Lainnya</h3>
        <div className="flex flex-col gap-3">
          {/* Ini cuma Dummy UI biar mirip YouTube */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex gap-2 group cursor-pointer">
              <div className="w-40 aspect-video bg-gray-200 rounded-lg flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-blue-600">
                  Video Rekomendasi {item}
                </h4>
                <p className="text-xs text-gray-500 mt-1">DOSHUB</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}