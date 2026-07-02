"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, FileText, TestTube2, X } from "lucide-react";
import { useState } from "react";

import { listAppointments } from "@/api/appointments";
import { getReport } from "@/api/reports";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@lab-app/shared";

export default function MyReportsPage() {
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const appointmentsQ = useQuery({
    queryKey: ["appointments", "mine"],
    queryFn:  () => listAppointments(),
  });

  const completed = (appointmentsQ.data?.data as Appointment[] ?? []).filter((a: Appointment) => a.status === "completed");

  const openReport = async (a: Appointment) => {
    setSelected(a);
    setDownloadUrl(null);
    setLoadingReport(true);
    try {
      const res = await getReport(a.id);
      setDownloadUrl(res.data.downloadUrl);
    } catch {
      setDownloadUrl(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Download your diagnostic test reports</p>
      </div>

      {/* Report modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Test Report</p>
                    <p className="text-[10px] text-emerald-100 mt-0.5">Booking #{selected.id.slice(0, 10)}</p>
                  </div>
                </div>
                <button
                  className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                  onClick={() => { setSelected(null); setDownloadUrl(null); }}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Tests */}
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Tests Included</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.testTypes.map((t) => (
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Collection Date</span>
                  <span className="font-semibold text-slate-700">{selected.slot?.split(" ")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-emerald-600">Completed</span>
                </div>
              </div>

              {loadingReport ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-sm text-slate-500">Loading report…</span>
                </div>
              ) : downloadUrl ? (
                <button
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-lg shadow-emerald-200"
                  onClick={handleDownload}
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  Download PDF Report
                </button>
              ) : (
                <div className="flex items-center justify-center py-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700 font-medium">Report not yet available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports list */}
      {appointmentsQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-28 rounded-2xl" key={i} />)}
        </div>
      ) : completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
          <FileText className="h-12 w-12 text-slate-300 mb-4" />
          <p className="font-bold text-slate-700">No reports yet</p>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs text-center">
            Reports will appear here once your sample has been analyzed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completed.map((a: Appointment) => (
            <Card
              className="rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group overflow-hidden"
              key={a.id}
              onClick={() => openReport(a)}
            >
              <div className="h-1 bg-emerald-400" />
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 transition">
                    <FileText className="h-5 w-5 text-emerald-600 group-hover:text-white transition" />
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {a.testTypes.map((t: string) => (
                        <span className="flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full" key={t}>
                          <TestTube2 className="h-2.5 w-2.5" /> {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">{a.slot?.split(" ")[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                    Ready
                  </span>
                  <Download className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Download App Banner ── */}
      <div className="mt-6 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 flex flex-col sm:flex-row items-center gap-5 shadow-lg shadow-emerald-100">
        <div className="h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <svg className="h-9 w-9 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.18 23.76a1.5 1.5 0 0 0 2.08.55l9.38-5.42-2.57-2.56-8.89 7.43zM20.44 9.64 17.2 7.76 14.37 10.6l3.1 3.1 2.98-1.72a1.5 1.5 0 0 0-.01-2.34zM1.5.9a1.5 1.5 0 0 0-.5 1.13v19.94a1.5 1.5 0 0 0 .5 1.13l.09.08 11.16-11.17v-.26L1.59.82 1.5.9zm12.25 12.87-1.42 1.42L3.26 24l-.09-.08 9.96-9.97 1.42 1.42L3.27 24l9.14-9.14 1.42 1.42z"/>
          </svg>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-white font-black text-lg leading-tight">Get reports on your phone</p>
          <p className="text-emerald-100 text-sm mt-1">Download the Lab Connect app to view, download and share your reports anytime, anywhere.</p>
        </div>
        <a
          href="https://play.google.com/store/apps/details?id=com.labconnect"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
        >
          <img
            src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
            alt="Get it on Google Play"
            className="h-14 w-auto"
          />
        </a>
      </div>
    </div>
  );
}
