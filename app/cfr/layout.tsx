"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  Clock3,
  FilePlus2,
  Files,
  LayoutDashboard,
  LayoutGrid,
  Menu,
} from "lucide-react";
import { SolidProBrand } from "@/components/shared/solid-pro-logo";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/cfr", icon: LayoutDashboard },
  { label: "Create CFR", href: "/cfr/create", icon: FilePlus2 },
  { label: "All CFRs", href: "/cfr/all", icon: Files },
];

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/cfr/create")) {
    return { title: "Create CFR", crumb: "New request" };
  }
  if (pathname.startsWith("/cfr/all")) {
    return { title: "All CFRs", crumb: "Requests" };
  }
  return { title: "Dashboard", crumb: "Overview" };
}

function formatClock(now: Date) {
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    now.getMonth()
  ];
  const day = now.getDate();
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${weekday}, ${month} ${day}, ${year} · ${hours}:${minutes}:${seconds} ${ampm}`;
}

export default function CfrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [time, setTime] = useState("");
  const page = getPageMeta(pathname);

  useEffect(() => {
    const stored = window.localStorage.getItem("cfr-sidebar-collapsed");
    if (stored === "1") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    const updateTime = () => setTime(formatClock(new Date()));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setIsCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("cfr-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  const isActive = (href: string) =>
    pathname === href || (href === "/cfr/all" && pathname.startsWith("/cfr/all"));

  const compact = isCollapsed && !mobileOpen;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div
        className={`relative flex min-h-[88px] items-center border-b border-line py-3 ${
          compact ? "justify-center px-3" : "px-5"
        }`}
      >
        <SolidProBrand subtitle="Customer Feedback Report" collapsed={compact} tone="light" />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-muted shadow-sm transition-colors duration-150 hover:bg-zinc-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none lg:inline-flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`h-3.5 w-3.5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <div key={item.label} className="group relative">
              <Link
                href={item.href}
                title={compact ? item.label : undefined}
                className={`relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  compact ? "justify-center" : "gap-3"
                } ${
                  active
                    ? "bg-accent-soft text-accent shadow-[inset_3px_0_0_0_#0f766e]"
                    : "text-muted hover:bg-zinc-50 hover:text-ink"
                }`}
              >
                <Icon className="h-[18px] w-[18px] text-current" />
                {!compact && <span className="truncate">{item.label}</span>}
              </Link>
              {compact && (
                <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-4 text-center text-[10px] tracking-wide text-muted">
        {!compact && <p>© 2026 SOLiDPRO</p>}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-ink">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-sidebar transition-[width,transform] duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 w-full items-center justify-between border-b border-line bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors duration-150 hover:bg-zinc-50 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-wide text-muted">
                Customer Feedback / {page.crumb}
              </p>
              <h1 className="truncate text-base font-semibold text-ink">{page.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted md:flex">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              <span suppressHydrationWarning>{time}</span>
            </div>
            <div className="hidden h-6 w-px bg-line sm:block" />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-zinc-50 hover:text-ink"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-zinc-50 hover:text-ink"
              aria-label="Apps"
              title="Apps"
            >
              <LayoutGrid className="h-5 w-5" aria-hidden="true" />
            </button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
              title="SOLiDPRO"
              aria-label="User"
            >
              SP
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
