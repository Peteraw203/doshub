"use client";

import Link from "next/link";
import { Play, Search, Upload, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

import { useState, useEffect } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useRouter } from "next/navigation";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    
    // Listen for auth events
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          setIsAuthenticated(true);
          break;
        case "signedOut":
          setIsAuthenticated(false);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  async function checkAuth() {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setIsAuthenticated(false);
      router.push("/");
      window.location.reload(); // Refresh to clear all states
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shadow-sm">
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
        <div className="flex w-full">
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-l-full text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button className="px-5 py-2 bg-gray-50 dark:bg-gray-800/50 border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Search className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        
        {isAuthenticated ? (
          <>
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Upload</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95 border border-gray-200 dark:border-gray-700"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/auth"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
