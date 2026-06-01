import { SetMetadata } from "@nestjs/common";

import type { UserRoleValue } from "../constants/domain.constants";

export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRoleValue[]) => SetMetadata(ROLES_KEY, roles);
