import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: DefaultSession["user"] & {
      id: string;
      role: "admin" | "employee" | "patient";
      phone?: string;
    };
  }

  interface User {
    id: string;
    role: "admin" | "employee" | "patient";
    accessToken: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: "admin" | "employee" | "patient";
    phone?: string;
  }
}
