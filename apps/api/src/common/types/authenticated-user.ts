import type { UserRoleValue } from "../constants/domain.constants";

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRoleValue;
}
