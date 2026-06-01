import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    error: "/auth-error"
  },
  secret: process.env.NEXTAUTH_SECRET ?? "labconnect-web-secret",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email"
        },
        password: {
          label: "Password",
          type: "password"
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Email and password required");
        }

        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password
          }),
          cache: "no-store"
        });

        const payload = (await response.json()) as {
          data?: {
            accessToken?: string;
            user?: {
              id: string;
              name: string;
              email: string;
              phone: string;
              role: "admin" | "employee" | "patient";
            };
          };
          message?: string;
          success?: boolean;
        };

        if (!response.ok || !payload.success || !payload.data?.accessToken || !payload.data.user) {
          throw new Error(payload.message ?? "Login failed");
        }

        if (payload.data.user.role !== "admin" && payload.data.user.role !== "patient") {
          throw new Error("Unauthorized role");
        }

        return {
          id: payload.data.user.id,
          name: payload.data.user.name,
          email: payload.data.user.email,
          phone: payload.data.user.phone,
          role: payload.data.user.role,
          accessToken: payload.data.accessToken
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phone = user.phone;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.name = token.name ?? "";
        session.user.email = token.email ?? "";
        session.user.phone = token.phone;
        session.user.role = token.role ?? "admin";
      }

      session.accessToken = token.accessToken;
      return session;
    }
  }
};
