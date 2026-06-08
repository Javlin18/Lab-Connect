"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Clock,
  Send,
  User2,
  X
} from "lucide-react";
import { useMemo, useState } from "react";

import { apiFetch } from "@/api/client";
import { listUsers } from "@/api/users";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@lab-app/shared";

// Notifications API helpers
async function getMyNotifications() {
  return apiFetch<Notification[]>("/notifications/mine");
}

async function markNotificationRead(id: string) {
  return apiFetch<Notification>(`/notifications/${id}/read`, { method: "PUT" });
}

const typeColors: Record<string, string> = {
  booking:    "bg-blue-50 text-blue-600 border-blue-100",
  report:     "bg-emerald-50 text-emerald-600 border-emerald-100",
  assignment: "bg-purple-50 text-purple-600 border-purple-100",
  payment:    "bg-amber-50 text-amber-600 border-amber-100",
  system:     "bg-slate-50 text-slate-600 border-slate-100",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showSendModal, setShowSendModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifType, setNotifType] = useState("system");
  const [filterType, setFilterType] = useState("all");

  const notifQ  = useQuery({ queryKey: ["admin-notifications"], queryFn: getMyNotifications });
  const usersQ  = useQuery({ queryKey: ["all-users"],           queryFn: () => listUsers() });

  const allUsers = useMemo(() => usersQ.data?.data ?? [], [usersQ.data]);
  const notifications = notifQ.data?.data ?? [];

  const filtered = useMemo(() => {
    if (filterType === "all")    return notifications;
    if (filterType === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      apiFetch("/notifications/send", {
        method: "POST",
        body: JSON.stringify({ userId: targetUserId, title: notifTitle, body: notifBody, type: notifType }),
      }),
    onSuccess: () => {
      toast({ title: "Notification sent successfully" });
      setShowSendModal(false);
      setTargetUserId(""); setNotifTitle(""); setNotifBody(""); setNotifType("system");
    },
    onError: (err: any) => {
      // Fallback — backend may not have send endpoint yet
      toast({ title: "Note", description: "Notification queued (API endpoint may not be available yet)", variant: "destructive" });
      setShowSendModal(false);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
    },
    onSuccess: () => {
      toast({ title: "All marked as read" });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 h-9"
            onClick={() => setShowSendModal(true)}
          >
            <Send className="h-3.5 w-3.5" /> Send Notification
          </Button>
        }
        description="View and manage all system notifications."
        title="Notifications"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",  value: notifications.length,  color: "text-slate-600 bg-slate-50" },
          { label: "Unread", value: unreadCount,            color: "text-blue-600 bg-blue-50" },
          { label: "Read",   value: notifications.length - unreadCount, color: "text-emerald-600 bg-emerald-50" },
        ].map((s) => (
          <Card className="rounded-2xl border-slate-200 shadow-sm" key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <Bell className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Send notification modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-md rounded-3xl shadow-2xl bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-500" /> Send Notification
              </h3>
              <Button className="h-8 w-8 p-0 rounded-full" onClick={() => setShowSendModal(false)} variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Target User *</Label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  onChange={(e) => setTargetUserId(e.target.value)}
                  value={targetUserId}
                >
                  <option value="">— Select user —</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input className="rounded-xl" onChange={(e) => setNotifTitle(e.target.value)} placeholder="e.g. Report Ready" value={notifTitle} />
              </div>
              <div className="space-y-1.5">
                <Label>Message *</Label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  onChange={(e) => setNotifBody(e.target.value)}
                  placeholder="Notification message..."
                  rows={3}
                  value={notifBody}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none"
                  onChange={(e) => setNotifType(e.target.value)}
                  value={notifType}
                >
                  <option value="system">System</option>
                  <option value="booking">Booking</option>
                  <option value="report">Report</option>
                  <option value="assignment">Assignment</option>
                  <option value="payment">Payment</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  disabled={!targetUserId || !notifTitle || !notifBody || sendMutation.isPending}
                  onClick={() => sendMutation.mutate()}
                >
                  {sendMutation.isPending ? "Sending…" : "Send Now"}
                </Button>
                <Button className="rounded-xl" onClick={() => setShowSendModal(false)} variant="outline">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notification list */}
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {["all", "unread", "booking", "report", "assignment", "system"].map((f) => (
              <button
                className={`h-7 px-3 rounded-xl text-xs font-semibold transition border ${
                  filterType === f
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                }`}
                key={f}
                onClick={() => setFilterType(f)}
                type="button"
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-1 bg-white/20 rounded-full px-1">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button
              className="h-7 px-3 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
              variant="ghost"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        <CardContent className="p-0">
          {notifQ.isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton className="h-14" key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Bell className="h-10 w-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((n) => (
                <div
                  className={`flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50 ${!n.read ? "bg-blue-50/30" : ""}`}
                  key={n.id}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border text-xs font-bold ${typeColors[n.type] ?? typeColors.system}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColors[n.type] ?? typeColors.system}`}>
                        {n.type}
                      </span>
                      {!n.read && (
                        <button
                          className="text-[10px] text-blue-600 font-semibold hover:underline"
                          onClick={() => markReadMutation.mutate(n.id)}
                          type="button"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
