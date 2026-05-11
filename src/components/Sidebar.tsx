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
  { label: "Your Videos", icon: Film, href: "#" },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" />
      )}

      <aside
        className={`fixed left-0 top-14 bottom-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out overflow-y-auto scrollbar-thin ${
          isOpen ? "w-56" : "w-[72px]"
        }`}
      >
        <nav className="flex flex-col py-2">
          {menuItems.map((item, index) => {
            if (item.label === "divider") {
              return (
                <div key={index} className="my-2 mx-3 border-t border-gray-200" />
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href;
            const isDisabled = item.href === "#";

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-5 mx-1.5 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : isDisabled
                    ? "text-gray-400 cursor-default"
                    : "text-gray-700 hover:bg-gray-100"
                } ${!isOpen ? "justify-center px-0" : ""}`}
                onClick={(e) => isDisabled && e.preventDefault()}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : isDisabled
                      ? "text-gray-300"
                      : "text-gray-600 group-hover:text-gray-900"
                  }`}
                />
                {isOpen && (
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
