"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, ShoppingBag, Trash2 } from "lucide-react";
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

// Helper to get next 7 days
const getNextDays = () => {
  const dates = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      dayName: days[d.getDay()],
      dateStr: d.toISOString().split("T")[0],
      displayDate: d.getDate()
    });
  }
  return dates;
};

const TIME_SLOTS = [
  "06:00 AM - 08:00 AM",
  "08:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM"
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

  // Load patient cart
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    enabled: status === "authenticated"
  });

  const cart = cartQuery.data?.data;
  const items = cart?.items || [];

  // Remove item mutation
  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Item removed from cart" });
    }
  });

  // Create Order mutation
  const checkoutMutation = useMutation({
    mutationFn: (data: any) => createOrder(data),
    onSuccess: (res) => {
      // Redirect to checkout with order info
      router.push(`/checkout?orderId=${res.data.orderId}&paymentId=${res.data.paymentId}&amount=${res.data.amount}&keyId=${res.data.keyId}`);
    },
    onError: (err: any) => {
      toast({
        title: "Error checking out",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-20 mx-auto max-w-md">
        <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 mt-4 text-lg">Please Log In First</h3>
        <p className="text-xs text-slate-400 mt-1">You must be logged in as a patient to view your cart.</p>
        <Link href="/login">
          <Button className="mt-6 rounded-xl bg-primary text-white">Login Now</Button>
        </Link>
      </div>
    );
  }

  // Calculate pricing breakdown
  let subtotal = 0;
  let discount = 0;
  const homeCollectionCharges = items.length > 0 ? 150 : 0;

  for (const item of items) {
    if (item.test) {
      const p = item.test.price;
      const dp = item.test.discountPrice ?? p;
      subtotal += p;
      discount += (p - dp);
    } else if (item.package) {
      const p = item.package.price;
      const dp = item.package.discountPrice ?? p;
      subtotal += p;
      discount += (p - dp);
    }
  }

  const total = subtotal - discount + homeCollectionCharges;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !phone || !address || !pincode) {
      toast({
        title: "Incomplete details",
        description: "Please fill in all patient details fields.",
        variant: "destructive"
      });
      return;
    }

    const slotStr = `${selectedDate} ${selectedSlot}`;
    checkoutMutation.mutate({
      patientName: name,
      patientAge: parseInt(age),
      patientGender: gender,
      patientPhone: phone,
      address,
      pincode,
      slot: slotStr
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-2">
        <ShoppingBag className="h-6 w-6 text-primary" /> Review Your Cart
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl">
          <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 mt-4">Your Cart is Empty</h3>
          <p className="text-xs text-slate-400 mt-1">Add blood tests or packages to start booking.</p>
          <Link href="/tests">
            <Button className="mt-6 rounded-xl bg-primary text-white">Browse Tests</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart list & Patient Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cart Items */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-slate-800 text-sm">Selected Tests & Packages</h2>
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const dataObj = item.test || item.package;
                  if (!dataObj) return null;

                  return (
                    <div className="py-4 flex justify-between items-center gap-4" key={item.id}>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">{dataObj.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.test ? "Single Test" : "Health Package"}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">
                            ₹{dataObj.discountPrice || dataObj.price}
                          </p>
                          {dataObj.discountPrice && (
                            <p className="text-[10px] text-slate-400 line-through">₹{dataObj.price}</p>
                          )}
                        </div>
                        <Button
                          className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-red-50 rounded-lg p-0"
                          onClick={() => removeMutation.mutate(item.id)}
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Patient Form */}
            <form className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" onSubmit={handleSubmit}>
              <h2 className="font-bold text-slate-800 text-sm">Patient & Sample Collection Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Full Name</Label>
                  <Input
                    id="patientName"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    value={name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientAge">Patient Age</Label>
                  <Input
                    id="patientAge"
                    min="1"
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="35"
                    required
                    type="number"
                    value={age}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientGender">Patient Gender</Label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    id="patientGender"
                    onChange={(e) => setGender(e.target.value)}
                    value={gender}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Contact Phone Number</Label>
                  <Input
                    id="patientPhone"
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    required
                    type="tel"
                    value={phone}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Full Collection Address</Label>
                  <Input
                    id="address"
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Flat No, Apartment, Street Name"
                    required
                    value={address}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="110001"
                    required
                    value={pincode}
                  />
                </div>
              </div>

              {/* Slot Picker */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <Label className="flex items-center gap-1"><Calendar className="h-4 w-4 text-primary" /> Select Date & Time Slot</Label>
                {/* Date Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {nextDays.map((d) => (
                    <button
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                        selectedDate === d.dateStr
                          ? "bg-primary border-primary text-white"
                          : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100"
                      }`}
                      key={d.dateStr}
                      onClick={() => setSelectedDate(d.dateStr)}
                      type="button"
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider">{d.dayName}</span>
                      <span className="text-sm font-black mt-0.5">{d.displayDate}</span>
                    </button>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((s) => (
                    <button
                      className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-center text-xs font-semibold transition ${
                        selectedSlot === s
                          ? "bg-primary/5 border-primary text-primary"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                      }`}
                      key={s}
                      onClick={() => setSelectedSlot(s)}
                      type="button"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit wrapper */}
              <div className="hidden">
                <button id="hidden-submit-btn" type="submit" />
              </div>
            </form>
          </div>

          {/* Checkout pricing panel */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4 sticky top-24">
              <h3 className="font-bold text-slate-800 text-sm">Price Details</h3>
              <div className="space-y-2 text-xs text-slate-500 pt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Home Collection Charges</span>
                  <span>₹{homeCollectionCharges}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-800">
                  <span>Total Amount</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6 rounded-2xl bg-primary hover:bg-primary/95 text-white py-6 font-bold shadow-lg shadow-primary/20 transition hover:scale-102"
                disabled={checkoutMutation.isPending}
                onClick={() => {
                  const btn = document.getElementById("hidden-submit-btn");
                  if (btn) btn.click();
                }}
              >
                {checkoutMutation.isPending ? "Creating Order..." : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
