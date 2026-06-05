"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";

import { listTests } from "@/api/tests";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookTestPage() {
  const testsQuery = useQuery({
    queryKey: ["tests"],
    queryFn: () => listTests(),
  });

  const tests = testsQuery.data?.data || [];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Book a Test</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Diagnostic tests for home collection</h1>
      </div>

      {testsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton className="h-44 rounded-2xl" key={i} />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-8 text-center">
            <FlaskConical className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">No tests available yet</p>
            <p className="text-xs text-slate-400 mt-1">Tests will appear here once added by admin.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const disc = test.discountPrice
              ? Math.round(((test.price - test.discountPrice) / test.price) * 100)
              : 0;
            return (
              <div
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-red-100 transition flex flex-col justify-between"
                key={test.id}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {test.category}
                    </span>
                    {disc > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {disc}% OFF
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{test.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{test.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-medium">
                      🩸 {test.sampleType}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-medium">
                      ⏱ {test.turnaroundHours}h
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-base font-black text-slate-800">₹{test.discountPrice ?? test.price}</p>
                    {test.discountPrice && (
                      <p className="text-[10px] text-slate-400 line-through">₹{test.price}</p>
                    )}
                  </div>
                  <Link
                    className="flex items-center gap-1 h-8 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    href={`/tests/${test.slug}`}
                  >
                    Book <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
