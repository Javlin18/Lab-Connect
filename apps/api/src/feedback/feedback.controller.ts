import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { FeedbackService } from "./feedback.service";

@ApiTags("Feedback")
@ApiBearerAuth()
@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Roles("patient")
  @Post()
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.submit(user.sub, dto);
  }

  @Roles("patient")
  @Get("pending")
  getPending(@CurrentUser() user: AuthenticatedUser) {
    return this.feedbackService.getPending(user.sub);
  }

  @Roles("admin")
  @Get("leaderboard")
  getLeaderboard() {
    return this.feedbackService.getLeaderboard();
  }

  @Roles("admin")
  @Get("alerts")
  getAlerts() {
    return this.feedbackService.getAlerts();
  }

  @Roles("admin")
  @Get("all")
  getAll(
    @Query("minRating") minRating?: string,
    @Query("maxRating") maxRating?: string,
    @Query("employeeId") employeeId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.feedbackService.getAll({
      minRating: minRating !== undefined ? +minRating : undefined,
      maxRating: maxRating !== undefined ? +maxRating : undefined,
      employeeId,
      dateFrom,
      dateTo,
      page: page !== undefined ? +page : undefined,
      limit: limit !== undefined ? +limit : undefined,
    });
  }

  @Roles("admin")
  @Get("employee/:employeeId")
  getByEmployee(@Param("employeeId") employeeId: string) {
    return this.feedbackService.getByEmployee(employeeId);
  }
}
