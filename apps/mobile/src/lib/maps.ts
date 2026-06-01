import * as Linking from "expo-linking";

export async function openGoogleMaps(address: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  await Linking.openURL(url);
}
