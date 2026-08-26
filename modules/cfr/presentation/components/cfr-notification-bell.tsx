"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import type { CfrNotification } from "../../domain/cfr.repository";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../server-actions/cfr-actions";

function formatNotificationTime(value: Date | string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB");
}

export function CfrNotificationBell() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<CfrNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    const result = await getNotificationsAction();
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
  };

  useEffect(() => {
    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleOpen = () => {
    setOpen((value) => !value);
    void loadNotifications();
  };

  const handleSelect = async (notification: CfrNotification) => {
    if (!notification.readAt) {
      await markNotificationReadAction(notification.id);
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date() } : item
        )
      );
    }
    setOpen(false);
    router.push(`/cfr/all?view=${notification.cfrId}`);
    router.refresh();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction();
    setUnreadCount(0);
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? new Date() })));
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-zinc-50 hover:text-ink"
        aria-label="Notifications"
        title="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="text-xs font-medium text-accent hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleSelect(notification)}
                  className={`flex w-full flex-col items-start gap-1 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-zinc-50 ${
                    notification.readAt ? "bg-white" : "bg-accent-soft/60"
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{notification.title}</p>
                    {!notification.readAt && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                  </div>
                  <p className="text-xs leading-5 text-muted">{notification.message}</p>
                  <p className="text-[11px] text-zinc-400">
                    {formatNotificationTime(notification.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
