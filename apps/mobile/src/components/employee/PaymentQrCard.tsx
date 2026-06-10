import * as Linking from "expo-linking";
import { Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { buildUpiLink } from "@/lib/upi";
import type { AppointmentPayment } from "@lab-app/shared";

export function PaymentQrCard({
  payment,
  patientName,
}: {
  payment: AppointmentPayment;
  patientName?: string;
}) {
  if (payment.paymentType !== "pay_on_collection" || payment.paymentStatus === "paid") {
    return null;
  }

  const upiLink = buildUpiLink(payment.totalAmount, payment.orderId, patientName);

  return (
    <View className="bg-orange-50 border border-orange-200 rounded-3xl p-5 mb-6 items-center">
      <Text className="text-xs font-extrabold text-orange-700 uppercase tracking-wider mb-1">
        Collect Payment
      </Text>
      <Text className="text-3xl font-black text-orange-800 mb-1">
        ₹{payment.totalAmount}
      </Text>
      <Text className="text-xs text-orange-600 mb-4 text-center">
        Patient chose pay later. Scan UPI QR.
      </Text>
      <View className="bg-white p-3 rounded-2xl mb-4">
        <QRCode value={upiLink} size={180} />
      </View>
      <TouchableOpacity
        className="w-full bg-orange-600 rounded-2xl py-3 items-center"
        onPress={() => Linking.openURL(upiLink)}
      >
        <Text className="text-white font-black text-sm">Open UPI App</Text>
      </TouchableOpacity>
    </View>
  );
}
