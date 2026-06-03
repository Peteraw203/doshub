"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  PlaySquare,
  Clock,
  ThumbsUp,
  Film,
  Upload,
  Users,
} from "lucide-react";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useEffect, useState } from "react";


interface SidebarProps {
  isOpen: boolean;
}

const menuItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Shorts", icon: Flame, href: "#" },
  { label: "Subscriptions", icon: Users, href: "#" },
  { label: "divider", icon: null, href: "" },
  { label: "Library", icon: PlaySquare, href: "#" },
  { label: "History", icon: Clock, href: "#" },
  { label: "Liked Videos", icon: ThumbsUp, href: "#" },
  { label: "divider", icon: null, href: "" },
  { label: "Upload", icon: Upload, href: "/upload" },
  { label: "Your Videos", icon: Film, href: "/your-videos" },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  // Filter menu items based on auth status
  const filteredMenuItems = menuItems.filter(item => {
    if (!isAuthenticated && (item.href === "/upload" || item.href === "/your-videos")) {
      return false;
    }
    return true;
  });

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" />
      )}

      <aside
        className={`fixed left-0 top-14 bottom-0 z-40 bg-gray-50 dark:bg-[#0a0a0a] transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden scrollbar-thin ${
          isOpen ? "w-56" : "w-[72px]"
        }`}
      >
        <nav className="flex flex-col py-2">
          {filteredMenuItems.map((item, index) => {
            if (item.label === "divider") {
              return (
                <div key={index} className="h-px my-3 mx-4 bg-gray-100/70 dark:bg-gray-800/30" />
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href;
            const isDisabled = item.href === "#";

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center mx-1.5 rounded-lg transition-all duration-300 group ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                    : isDisabled
                    ? "text-gray-400 dark:text-gray-600 cursor-default"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                } ${isOpen ? "px-4 py-2.5 gap-4" : "px-5 py-2.5 gap-0"}`}
                onClick={(e) => isDisabled && e.preventDefault()}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-blue-600 dark:text-blue-500"
                      : isDisabled
                      ? "text-gray-300 dark:text-gray-700"
                      : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                  }`}
                />
                <span className={`text-sm whitespace-nowrap transition-all duration-300 ease-in-out origin-left ${
                  isOpen 
                    ? "opacity-100 max-w-[150px] translate-x-0 scale-100" 
                    : "opacity-0 max-w-0 translate-x-2 scale-95 overflow-hidden pointer-events-none"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className={`mx-4 mt-6 p-4 bg-black/5 dark:bg-white/5 rounded-2xl transition-all duration-300 ease-in-out ${
            !isAuthenticated && isOpen 
              ? "opacity-100 max-h-40 transform translate-y-0 scale-100" 
              : "opacity-0 max-h-0 py-0 my-0 border-none overflow-hidden pointer-events-none scale-95"
          }`}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Sign in to upload, like, and comment on videos.
            </p>
            <Link
              href="/auth"
              className="flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-100/50 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
