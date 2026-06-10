"use client";

import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { getCallLogs } from "@/api/calls";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function statusColor(status: string) {
  if (status === "completed") return "text-green-600 bg-green-50";
  if (status === "in-progress") return "text-blue-600 bg-blue-50";
  if (status === "failed" || status === "no-answer") return "text-red-600 bg-red-50";
  return "text-slate-600 bg-slate-100";
}

export default function CallLogsPage() {
  const query = useQuery({
    queryKey: ["call-logs"],
    queryFn: getCallLogs,
    refetchInterval: 30000,
  });

  const logs = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Logs"
        description="All incoming calls — which were routed to employees vs. office."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {logs.length} Total Calls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No call logs yet. Configure Twilio webhook to <code>/calls/incoming-call</code>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>From (Patient)</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Routed To</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.fromPhone}</TableCell>
                      <TableCell>{log.patientName ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="font-mono text-sm">{log.toPhone}</TableCell>
                      <TableCell>
                        {log.employeeName ? (
                          <span className="text-emerald-700 font-medium">{log.employeeName}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Office fallback</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.duration != null ? `${log.duration}s` : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
