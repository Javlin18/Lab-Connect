"use client";

import { Headphones, Mail, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Support</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Get help with bookings & collection</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="p-5">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-3">
              <Phone className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm">Call Support</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-slate-500 mb-3">Mon–Sat, 7 AM – 9 PM</p>
            <p className="font-bold text-slate-800 text-sm">1800-200-4567</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="p-5">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-3">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm">Email Support</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-slate-500 mb-3">Response within 24 hrs</p>
            <p className="font-bold text-slate-800 text-sm">care@labconnect.com</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="p-5">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-3">
              <MessageCircle className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm">WhatsApp</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-xs text-slate-500 mb-3">Quick chat support</p>
            <Button className="h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs">
              <Headphones className="mr-1.5 h-3.5 w-3.5" /> Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
