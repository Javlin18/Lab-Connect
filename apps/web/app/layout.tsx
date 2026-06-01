import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/components/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Labconnect Admin",
  description: "Admin panel for lab operations"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
