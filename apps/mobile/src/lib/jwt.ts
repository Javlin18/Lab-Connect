import { jwtDecode } from "jwt-decode";

import type { User } from "@lab-app/shared";

type TokenPayload = {
  email: string;
  role: User["role"];
  sub: string;
};

export function getUserFromToken(token: string): User {
  const payload = jwtDecode<TokenPayload>(token);

  return {
    id: payload.sub,
    name: payload.email.split("@")[0] ?? "user",
    email: payload.email,
    phone: "",
    role: payload.role,
    createdAt: new Date(0).toISOString()
  };
}
