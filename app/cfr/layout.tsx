"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SolidProLogo } from "@/components/shared/solid-pro-logo";

export default function CfrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [time, setTime] = useState("");

  // Live date and time updater matching SolidPro Helpdesk clock format
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine topbar page title based on route
  const getPageTitle = () => {
    switch (pathname) {
      case "/cfr/create":
        return "Create CFR";
      case "/cfr/all":
        return "My Tickets"; // SolidPro matches My Tickets in reference screenshot
      case "/cfr":
      default:
        return "Dashboard";
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/cfr",
      icon: (
        <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3zM14 16a2 2 0 012-2h2a2 2 0 012 2v3a2 2 0 01-2 2h-2a2 2 0 01-2-2v-3z" />
        </svg>
      ),
    },
    {
      label: "Create CFR",
      href: "/cfr/create",
      icon: (
        <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "All CFRs",
      href: "/cfr/all",
      icon: (
        <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F6FA] text-[#0f172a] font-sans antialiased">
      {/* 1. Collapsible Sidebar (SolidPro Royal Blue #163172) */}
      <aside
        className={`relative z-20 flex flex-col bg-[#163172] text-slate-350 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand/Logo Area */}
        <div className="flex h-24 flex-col items-center justify-center border-b border-white/10 px-4 pt-3 text-center">
          {!isCollapsed ? (
            <div className="flex flex-col items-center justify-center">
              <SolidProLogo className="h-8 w-auto text-white" />
              <span className="text-[10px] font-bold text-slate-300/80 uppercase tracking-[0.2em] mt-1.5">
                CUSTOMER FEEDBACK
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white tracking-widest">SP</span>
              <span className="text-[8px] font-bold text-slate-300/80 tracking-wider">CFR</span>
            </div>
          )}

          {/* Sidebar Collapse Circle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3.5 top-7 z-35 flex h-7 w-7 items-center justify-center rounded-full bg-[#163172] text-white border border-white/10 shadow-sm focus:outline-none"
          >
            <svg
              className={`h-3.5 w-3.5 transform transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-2 px-3.5 py-6">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/cfr/all" && pathname.startsWith("/cfr/all"));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all relative ${
                  isActive
                    ? "bg-white/10 border border-white/20 text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {/* Left Active Solid White Indicator Bar matching screenshot exact layout */}
                {isActive && (
                  <div className="absolute left-0 top-[2px] bottom-[2px] w-[5px] bg-white rounded-r-md rounded-l-sm" />
                )}
                
                <div className={`${isActive ? "text-white" : "text-slate-400"}`}>{item.icon}</div>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Brand Footer */}
        <div className="border-t border-white/10 p-4 text-center text-[10px] text-slate-400">
          {!isCollapsed && <p>© 2026 SOLiDPRO</p>}
        </div>
      </aside>

      {/* 2. Main Content Frame */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar Layout */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          {/* Breadcrumb Title */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-450">{getPageTitle()}</span>
          </div>

          {/* Right side widgets - Only keeping the Dynamic Clock display as requested */}
          <div className="flex items-center gap-5">
            {/* Live Clock Display with clock icon */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <svg className="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{time}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Layout Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
