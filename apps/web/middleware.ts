import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    // Redirect patient from /dashboard root to homepage
    if (path === "/dashboard" && token?.role === "patient") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Admin routes — admin only
        if (path.startsWith("/admin")) {
          return token?.role === "admin";
        }

        // Employee routes — employee only
        // Patient sub-pages (bookings, reports, etc.) — any authenticated user
        if (
          path.startsWith("/dashboard/") ||
          path.startsWith("/checkout") ||
          path.startsWith("/order-success")
        ) {
          return !!token;
        }

        // /dashboard root — allow (will redirect to / for patients above)
        if (path === "/dashboard") {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/order-success/:path*",
  ],
};
