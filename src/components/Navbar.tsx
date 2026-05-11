"use client";

import Link from "next/link";
import { Play, Search, Upload, Menu } from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <Link href="/" className="flex items-center gap-1.5 group">
          <div className="bg-blue-600 rounded-lg p-1.5 group-hover:bg-blue-700 transition-colors">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            DOS<span className="text-blue-600">HUB</span>
          </span>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden sm:flex items-center flex-1 max-w-xl mx-8">
        <div className="flex w-full">
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full px-4 py-2 border border-gray-300 rounded-l-full text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
          />
          <button className="px-5 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-100 transition-colors">
            <Search className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Right: Upload Button */}
      <div className="flex items-center gap-3">
        <Link
          href="/upload"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden md:inline">Upload</span>
        </Link>
        {/* Dummy user avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          U
        </div>
      </div>
    </header>
  );
}
