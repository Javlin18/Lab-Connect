import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET ?? "labconnect-web-secret",
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/admin")) {
          return token?.role === "admin";
        }
        if (
          path.startsWith("/dashboard") ||
          path.startsWith("/checkout") ||
          path.startsWith("/order-success")
        ) {
          return !!token;
        }
        return true;
      }
    }
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/checkout/:path*",
    "/order-success/:path*"
  ]
};
