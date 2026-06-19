import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { memoryStorage } from "multer";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { ReportsService } from "./reports.service";

@ApiTags("Reports")
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles("admin")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      fileFilter: (_request, file, callback) => {
        callback(null, ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
      },
      limits: { fileSize: 10 * 1024 * 1024 }
    })
  )
  @Post(":appointmentId/upload")
  upload(
    @Param("appointmentId") appointmentId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.reportsService.upload(appointmentId, file, user.sub);
  }

  @Roles("patient", "admin")
  @Get(":appointmentId")
  getReport(
    @Param("appointmentId") appointmentId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.reportsService.getByAppointment(appointmentId, user);
  }
}
