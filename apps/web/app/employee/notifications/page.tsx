"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { apiFetch } from "@/api/client";
import { EmployeeShell } from "@/components/app/employee-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@lab-app/shared";

async function getMyNotifications() {
  return apiFetch<Notification[]>("/notifications/mine");
}
async function markRead(id: string) {
  return apiFetch<Notification>(`/notifications/${id}/read`, { method: "PUT" });
}

const typeColors: Record<string, string> = {
  appointment_assigned: "bg-blue-50 text-blue-600 border-blue-100",
  appointment_status:   "bg-cyan-50 text-cyan-600 border-cyan-100",
  appointment_completed:"bg-emerald-50 text-emerald-600 border-emerald-100",
  system:               "bg-slate-50 text-slate-600 border-slate-100",
};

export default function EmployeeNotificationsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notifQ = useQuery({ queryKey: ["employee", "notifications"], queryFn: getMyNotifications });

  const allNotifs = notifQ.data?.data ?? [];
  const unreadCount = allNotifs.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (filter === "unread") return allNotifs.filter((n) => !n.read);
    return allNotifs;
  }, [allNotifs, filter]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee", "notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(allNotifs.filter((n) => !n.read).map((n) => markRead(n.id)));
    },
    onSuccess: () => {
      toast({ title: "All marked as read" });
      queryClient.invalidateQueries({ queryKey: ["employee", "notifications"] });
    },
  });

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <EmployeeShell userName={session?.user?.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-blue-600 font-semibold mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button className="h-8 px-3 rounded-xl text-xs border-slate-200 text-slate-600" disabled={markAllReadMutation.isPending} onClick={() => markAllReadMutation.mutate()} variant="outline">
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              className={`h-8 px-4 rounded-xl text-xs font-semibold transition border ${
                filter === f ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200"
              }`}
              key={f}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === "all" ? `All (${allNotifs.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {notifQ.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton className="h-14" key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <Bell className="h-10 w-10 mb-3 text-slate-300" />
                <p className="text-sm font-medium">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map((n) => (
                  <div className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition ${!n.read ? "bg-blue-50/20" : ""}`} key={n.id}>
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeColors[n.type] ?? typeColors.system}`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold ${!n.read ? "text-slate-900" : "text-slate-700"}`}>{n.title}</p>
                        <div className="flex items-center gap-2">
                          {!n.read && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                      {!n.read && (
                        <button className="text-[10px] text-blue-600 font-semibold hover:underline mt-1" onClick={() => markReadMutation.mutate(n.id)} type="button">
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeShell>
  );
}
