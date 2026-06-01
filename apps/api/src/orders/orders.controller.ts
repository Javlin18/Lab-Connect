import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { CreateOrderDto } from "./dto/create-order.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";
import { OrdersService } from "./orders.service";

@ApiTags("Orders")
@ApiBearerAuth()
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles("patient", "admin")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.sub, dto);
  }

  @Public()
  @Post("verify-payment")
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.ordersService.verifyPayment(dto);
  }

  @Roles("patient")
  @Get("mine")
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findMine(user.sub);
  }

  @Roles("admin")
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }
}
