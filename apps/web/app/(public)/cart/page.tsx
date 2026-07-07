"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  ShoppingBag,
  ShieldCheck,
  Tag,
  Trash2,
  User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { getCart, removeFromCart } from "@/api/cart";
import { createOrder } from "@/api/orders";
import { LocationPicker, type LocationData } from "@/components/app/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const getNextDays = () => {
  const dates = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({ dayName: days[d.getDay()], dateStr: d.toISOString().split("T")[0], displayDate: d.getDate() });
  }
  return dates;
};

const TIME_SLOTS = [
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM",
];

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName]     = useState("");
  const [age, setAge]       = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone]   = useState("");

  const [location, setLocation] = useState<LocationData>({
    address: "", city: "", pincode: "", landmark: "", latitude: null, longitude: null,
  });

  const nextDays = getNextDays();
  const [selectedDate, setSelectedDate] = useState(nextDays[0].dateStr);
  const [selectedTime, setSelectedTime] = useState<string>("09:00 AM");
  const [paymentType, setPaymentType] = useState<"online_prepaid" | "pay_on_collection">("online_prepaid");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (!name && session.user.name) setName(session.user.name);
      if (!phone && session.user.phone) setPhone(session.user.phone);
    }
  }, [status, session, name, phone]);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn:  () => getCart(),
    enabled:  status === "authenticated",
  });

  const cart  = cartQuery.data?.data;
  const items = cart?.items || [];

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Item removed" });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: any) => createOrder(data),
    onSuccess: (res) => {
      if (res.data.paymentType === "pay_on_collection") {
        router.push(`/order-success?id=${res.data.orderId}`);
      } else {
        router.push(`/checkout?orderId=${res.data.orderId}&amount=${res.data.amount}`);
      }
    },
    onError: (err: any) => {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    },
  });

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="h-9 w-9 text-red-400" />
          </div>
          <h3 className="font-bold text-slate-800 text-xl">Login Required</h3>
          <p className="text-sm text-slate-400 mt-2">Please login as a patient to view your cart.</p>
          <Link href="/login">
            <Button className="mt-6 rounded-xl bg-red-600 hover:bg-red-700 text-white px-8">Login Now</Button>
          </Link>
        </div>
      </div>
    );
  }

  let subtotal = 0, discount = 0;
  const homeCollectionCharges = items.length > 0 ? 150 : 0;
  for (const item of items) {
    const obj = item.test || item.package;
    if (obj) { subtotal += obj.price; discount += (obj.price - (obj.discountPrice ?? obj.price)); }
  }
  const total = subtotal - discount + homeCollectionCharges;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !phone) {
      toast({ title: "Fill all patient details", variant: "destructive" }); return;
    }
    if (!location.address || !location.city || !location.pincode) {
      toast({ title: "Please complete your collection address", variant: "destructive" }); return;
    }

    // Build full address string including landmark + coords for backend
    const fullAddress = [
      location.address,
      location.landmark ? `(Near: ${location.landmark})` : "",
      location.city,
      location.pincode,
      location.latitude ? `[${location.latitude.toFixed(5)},${location.longitude!.toFixed(5)}]` : "",
    ].filter(Boolean).join(", ");

    checkoutMutation.mutate({
      patientName:   name,
      patientAge:    parseInt(age),
      patientGender: gender,
      patientPhone:  phone,
      address:       fullAddress,
      pincode:       location.pincode,
      slot:          `${selectedDate} ${selectedTime}`,
      paymentType:   paymentType,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Your Cart</h1>
          <p className="text-xs text-slate-400">{items.length} item{items.length !== 1 ? "s" : ""} selected</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <ShoppingBag className="h-14 w-14 text-slate-300 mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">Cart is Empty</h3>
          <Link href="/tests">
            <Button className="mt-5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-8">Browse Tests</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cart items */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <Tag className="h-4 w-4 text-red-500" />
                <h2 className="font-bold text-slate-800 text-sm">Selected Tests & Packages</h2>
              </div>
              <div className="divide-y divide-slate-50 px-6">
                {items.map((item) => {
                  const obj  = item.test || item.package;
                  if (!obj) return null;
                  const disc = obj.discountPrice ? Math.round(((obj.price - obj.discountPrice) / obj.price) * 100) : 0;
                  return (
                    <div className="py-5 flex items-center justify-between gap-4" key={item.id}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{obj.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full font-medium">
                              {item.test ? "Blood Test" : "Health Package"}
                            </span>
                            {disc > 0 && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">{disc}% OFF</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-black text-slate-800">₹{obj.discountPrice ?? obj.price}</p>
                          {obj.discountPrice && <p className="text-[10px] text-slate-400 line-through">₹{obj.price}</p>}
                        </div>
                        <button
                          className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center"
                          onClick={() => removeMutation.mutate(item.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Patient details + location form */}
            <form className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" onSubmit={handleSubmit}>
              {/* Patient info section */}
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <User className="h-4 w-4 text-red-500" />
                <h2 className="font-bold text-slate-800 text-sm">Patient Details</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pName">Full Name *</Label>
                  <Input className="rounded-xl h-10" id="pName" onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" required value={name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pAge">Age *</Label>
                  <Input className="rounded-xl h-10" id="pAge" min="1" onChange={(e) => setAge(e.target.value)} placeholder="32" required type="number" value={age} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pGender">Gender *</Label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 h-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20" id="pGender" onChange={(e) => setGender(e.target.value)} value={gender}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pPhone">Phone Number *</Label>
                  <Input className="rounded-xl h-10" id="pPhone" onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" required type="tel" value={phone} />
                </div>
              </div>

              {/* Location section */}
              <div className="px-6 pb-6 border-t border-slate-50 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Collection Location</h3>
                </div>
                <LocationPicker value={location} onChange={setLocation} />
              </div>

              {/* Slot picker */}
              <div className="px-6 pb-6 border-t border-slate-50 pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Collection Date</h3>
                </div>

                {/* Date grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {nextDays.map((d) => (
                    <button
                      className={`flex flex-col items-center py-3 rounded-xl border text-center transition font-medium ${
                        selectedDate === d.dateStr
                          ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-200"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:border-red-200 hover:bg-red-50"
                      }`}
                      key={d.dateStr}
                      onClick={() => setSelectedDate(d.dateStr)}
                      type="button"
                    >
                      <span className="text-[9px] uppercase tracking-wider font-bold">{d.dayName}</span>
                      <span className="text-base font-black mt-0.5">{d.displayDate}</span>
                    </button>
                  ))}
                </div>

                {/* Time picker */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-red-500" />
                    <h3 className="font-bold text-slate-800 text-sm">Select Time</h3>
                  </div>
                  <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl border font-bold text-sm transition ${
                          selectedTime === time
                            ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-200"
                            : "bg-slate-50 border-slate-100 text-slate-600 hover:border-red-200 hover:bg-red-50"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden">
                <button id="hidden-submit-btn" type="submit" />
              </div>
            </form>
          </div>

          {/* ── Right — Price Summary ────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center gap-2 text-white">
                <CreditCard className="h-4 w-4" />
                <h3 className="font-bold text-sm">Price Summary</h3>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>− ₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-red-400" /> Home Collection
                  </span>
                  <span className="font-semibold text-slate-700">₹{homeCollectionCharges}</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="font-bold text-slate-800">Total</span>
                  <span className="text-xl font-black text-red-600">₹{total}</span>
                </div>
                {discount > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-emerald-700 font-semibold">You save ₹{discount}!</p>
                  </div>
                )}

                {/* Location preview */}
                {location.address && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Collection Location</p>
                    <p className="text-xs text-slate-700 line-clamp-2">{location.address}</p>
                    {location.city && <p className="text-[10px] text-slate-500 mt-0.5">{location.city} — {location.pincode}</p>}
                    {location.latitude && (
                      <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> GPS Pinned
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="px-6 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType("online_prepaid")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                      paymentType === "online_prepaid"
                        ? "bg-red-50 border-red-500 text-red-600 shadow-sm"
                        : "bg-slate-50 border-slate-100 text-slate-600 hover:border-red-200 hover:bg-red-50"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mb-1" />
                    Pay Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("pay_on_collection")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition ${
                      paymentType === "pay_on_collection"
                        ? "bg-red-50 border-red-500 text-red-600 shadow-sm"
                        : "bg-slate-50 border-slate-100 text-slate-600 hover:border-red-200 hover:bg-red-50"
                    }`}
                  >
                    <User className="h-4 w-4 mb-1" />
                    Pay Later
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6">
                <Button
                  className="w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white h-12 font-bold shadow-lg shadow-red-200 text-sm"
                  disabled={checkoutMutation.isPending}
                  onClick={() => { document.getElementById("hidden-submit-btn")?.click(); }}
                >
                  {checkoutMutation.isPending ? "Creating Order…" : paymentType === "pay_on_collection" ? "Confirm Booking →" : "Proceed to Payment →"}
                </Button>
              </div>

              <div className="border-t border-slate-50 px-6 py-4 space-y-2">
                {["256-bit SSL Encrypted", "NABL Certified Lab", "Free Cancellation"].map((t) => (
                  <div className="flex items-center gap-2 text-[10px] text-slate-400" key={t}>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
