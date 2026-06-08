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
import { useState } from "react";

import { getCart, removeFromCart } from "@/api/cart";
import { createOrder } from "@/api/orders";
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
  "06:00 AM – 08:00 AM",
  "08:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 02:00 PM",
  "02:00 PM – 04:00 PM",
];

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  const nextDays = getNextDays();
  const [selectedDate, setSelectedDate] = useState(nextDays[0].dateStr);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    enabled: status === "authenticated",
  });

  const cart = cartQuery.data?.data;
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
      router.push(`/checkout?orderId=${res.data.orderId}&paymentId=${res.data.paymentId}&amount=${res.data.amount}&keyId=${res.data.keyId}`);
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
          <p className="text-sm text-slate-400 mt-2">Please login as a patient to view your cart and proceed to checkout.</p>
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
    if (!name || !age || !phone || !address || !pincode) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    checkoutMutation.mutate({
      patientName: name, patientAge: parseInt(age), patientGender: gender,
      patientPhone: phone, address, pincode, slot: `${selectedDate} ${selectedSlot}`,
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
          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-5">
            <ShoppingBag className="h-9 w-9 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg">Cart is Empty</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-xs text-center">Add diagnostic tests or health packages to start your booking.</p>
          <Link href="/tests">
            <Button className="mt-6 rounded-xl bg-red-600 hover:bg-red-700 text-white px-8">Browse Tests</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Cart items card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <Tag className="h-4 w-4 text-red-500" />
                <h2 className="font-bold text-slate-800 text-sm">Selected Tests & Packages</h2>
              </div>
              <div className="divide-y divide-slate-50 px-6">
                {items.map((item) => {
                  const obj = item.test || item.package;
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
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                                {disc}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-black text-slate-800">₹{obj.discountPrice ?? obj.price}</p>
                          {obj.discountPrice && (
                            <p className="text-[10px] text-slate-400 line-through">₹{obj.price}</p>
                          )}
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

            {/* Patient details form */}
            <form className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <User className="h-4 w-4 text-red-500" />
                <h2 className="font-bold text-slate-800 text-sm">Patient Details</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="patientName">Full Name *</Label>
                  <Input className="rounded-xl" id="patientName" onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" required value={name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patientAge">Age *</Label>
                  <Input className="rounded-xl" id="patientAge" min="1" onChange={(e) => setAge(e.target.value)} placeholder="32" required type="number" value={age} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patientGender">Gender *</Label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20" id="patientGender" onChange={(e) => setGender(e.target.value)} value={gender}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patientPhone">Phone Number *</Label>
                  <Input className="rounded-xl" id="patientPhone" onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" required type="tel" value={phone} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Collection Address *</Label>
                  <Input className="rounded-xl" id="address" onChange={(e) => setAddress(e.target.value)} placeholder="House No., Street, Colony, City" required value={address} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input className="rounded-xl" id="pincode" onChange={(e) => setPincode(e.target.value)} placeholder="110001" required value={pincode} />
                </div>
              </div>

              {/* Slot picker */}
              <div className="px-6 pb-6 space-y-4 border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Select Collection Date & Slot</h3>
                </div>

                {/* Date */}
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

                {/* Time slots */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((s) => (
                    <button
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                        selectedSlot === s
                          ? "bg-red-50 border-red-500 text-red-600 shadow-sm"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:border-red-200 hover:bg-red-50"
                      }`}
                      key={s}
                      onClick={() => setSelectedSlot(s)}
                      type="button"
                    >
                      <Clock className="h-3.5 w-3.5" /> {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden">
                <button id="hidden-submit-btn" type="submit" />
              </div>
            </form>
          </div>

          {/* Right — Price Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden sticky top-24">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
                <div className="flex items-center gap-2 text-white">
                  <CreditCard className="h-4 w-4" />
                  <h3 className="font-bold text-sm">Price Summary</h3>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Discount Applied</span>
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
                    <p className="text-xs text-emerald-700 font-semibold">You save ₹{discount} on this order!</p>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6">
                <Button
                  className="w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white h-12 font-bold shadow-lg shadow-red-200 text-sm"
                  disabled={checkoutMutation.isPending}
                  onClick={() => { const btn = document.getElementById("hidden-submit-btn"); if (btn) btn.click(); }}
                >
                  {checkoutMutation.isPending ? "Creating Order..." : "Proceed to Payment →"}
                </Button>
              </div>

              {/* Trust badges */}
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
