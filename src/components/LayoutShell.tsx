"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <Sidebar isOpen={sidebarOpen} />
      <main
        className={`mt-14 min-h-[calc(100vh-3.5rem)] transition-all duration-300 ease-in-out bg-gray-50 dark:bg-[#0a0a0a] ${
          sidebarOpen ? "ml-56" : "ml-[72px]"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </>
  );
}
