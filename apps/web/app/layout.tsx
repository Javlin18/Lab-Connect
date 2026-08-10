import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ErrorBoundary } from "@/components/app/error-boundary";
import { Providers } from "@/components/app/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Labconnect: NABL ACCREDITED",
  description: "Admin panel for lab operations"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
