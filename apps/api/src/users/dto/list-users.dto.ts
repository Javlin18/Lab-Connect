import { IsIn, IsOptional } from "class-validator";

import { USER_ROLES } from "../../common/constants/domain.constants";

export class ListUsersDto {
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: (typeof USER_ROLES)[number];
}
