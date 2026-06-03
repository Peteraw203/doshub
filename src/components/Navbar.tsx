"use client";

import Link from "next/link";
import { Play, Search, Upload, Menu, User, LogOut, Film, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

import { useState, useEffect, useRef } from "react";
import { getCurrentUser, signOut, fetchUserAttributes } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useRouter } from "next/navigation";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAttributes, setUserAttributes] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for auth events
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          setIsAuthenticated(true);
          checkAuth();
          break;
        case "signedOut":
          setIsAuthenticated(false);
          setUserAttributes(null);
          setIsDropdownOpen(false);
          break;
      }
    });

    // Close dropdown on click outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function checkAuth() {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
      const attrs = await fetchUserAttributes();
      setUserAttributes(attrs);
    } catch {
      setIsAuthenticated(false);
      setUserAttributes(null);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserAttributes(null);
      setIsDropdownOpen(false);
      router.push("/");
      window.location.reload(); // Refresh to clear all states
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-gray-50/85 dark:bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between px-4 transform-gpu">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <Link href="/" className="flex items-center gap-1.5 group">
          <div className="bg-blue-600 rounded-lg p-1.5 group-hover:bg-blue-700 transition-colors">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            DOS<span className="text-blue-600 dark:text-blue-500">HUB</span>
          </span>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden sm:flex items-center flex-1 max-w-xl mx-8">
        <form onSubmit={handleSearchSubmit} className="flex w-full">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-l-full text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button type="submit" className="px-5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <Search className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </form>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none cursor-pointer"
            aria-label="Account menu"
          >
            {isAuthenticated ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {(userAttributes?.name || userAttributes?.email || "U").charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
                <User className="w-5 h-5" />
              </div>
            )}
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {isAuthenticated ? (
                <>
                  {/* User Profile Header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {userAttributes?.name || "DOSHUB User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {userAttributes?.email || ""}
                    </p>
                  </div>
                  
                  {/* Links */}
                  <div className="py-1.5">
                    <Link
                      href="/upload"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>Upload Video</span>
                    </Link>
                    <Link
                      href="/your-videos"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Film className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>Your Videos</span>
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                  
                  {/* Sign Out */}
                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Welcome Info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Welcome to DOSHUB
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Sign in to upload and manage your videos.
                    </p>
                  </div>
                  
                  {/* Sign In Link */}
                  <div className="p-2">
                    <Link
                      href="/auth"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-200 dark:shadow-none active:scale-95"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Sign Up</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
