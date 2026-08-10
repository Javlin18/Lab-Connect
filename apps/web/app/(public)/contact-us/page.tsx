"use client";

import { Activity, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xl shadow-red-200 mx-auto">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900">Contact Us</h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
            Have questions about your diagnostic tests, home collection booking, or reports? We are here to help. Reach out to the LabConnect team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Visit Us</h3>
            <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-wider">
              55/18 dada thanthanpal word no.72<br />
              Rivjha green city<br />
              Jabalpur 482001
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-4">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Call Us</h3>
            <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-wider">
              +91 7693080021<br />
              +91 8602363472
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Mon–Sat: 7 AM – 9 PM</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center">
            <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Email Us</h3>
            <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-wider">
              labconnect.work@gmail.com
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">We usually reply within 24 hours</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Send us a message</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Thanks for reaching out! We'll get back to you soon."); }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <input required type="text" placeholder="Your Name" className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white focus:ring-1 focus:ring-red-500" />
                <input required type="email" placeholder="Your Email address" className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white focus:ring-1 focus:ring-red-500" />
              </div>
              <input required type="tel" placeholder="Phone Number" className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-sm focus:bg-white focus:ring-1 focus:ring-red-500" />
              <textarea required placeholder="How can we help you?" rows={4} className="w-full rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus:bg-white focus:ring-1 focus:ring-red-500 resize-none"></textarea>
              <button type="submit" className="h-12 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-200 transition">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
