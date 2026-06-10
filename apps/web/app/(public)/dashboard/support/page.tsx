"use client";

import { Headphones, Mail, MessageCircle, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Support</h1>
        <p className="text-sm text-slate-500 mt-1">Get help with your bookings, collections, and reports</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Phone,        label: "Call Support",  sub: "1800-200-4567",        color: "bg-blue-50 text-blue-600",   buttonLabel: "Call Now",     href: "tel:+911800200456" },
          { icon: Mail,         label: "Email Support", sub: "care@labconnect.com",  color: "bg-red-50 text-red-600",     buttonLabel: "Send Email",   href: "mailto:care@labconnect.com" },
          { icon: MessageCircle,label: "WhatsApp",      sub: "Quick chat support",   color: "bg-emerald-50 text-emerald-600", buttonLabel: "Open Chat", href: "#" },
        ].map((item) => (
          <Card className="rounded-2xl border-slate-200 shadow-sm" key={item.label}>
            <CardHeader className="p-5">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-xs text-slate-500 mb-4">{item.sub}</p>
              <a href={item.href}>
                <Button className="w-full h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold">
                  {item.buttonLabel}
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="px-5 py-4 border-b border-slate-50">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Headphones className="h-4 w-4 text-red-500" /> Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {[
            { q: "When will the phlebotomist arrive?", a: "Within 60 minutes of your booked slot." },
            { q: "When will my report be ready?",      a: "Reports are typically ready in 12–24 hours." },
            { q: "Can I reschedule my booking?",       a: "Call us at 1800-200-4567 to reschedule up to 2 hours before your slot." },
            { q: "Is home collection free?",           a: "A nominal home collection charge of ₹150 applies." },
          ].map((faq) => (
            <div className="border-b border-slate-50 pb-4 last:border-0 last:pb-0" key={faq.q}>
              <p className="text-sm font-bold text-slate-800">{faq.q}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
