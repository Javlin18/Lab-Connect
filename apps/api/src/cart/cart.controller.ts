import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { CartService } from "./cart.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";

@ApiTags("Cart")
@ApiBearerAuth()
@Controller("cart")
@Roles("patient", "admin")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.getOrCreateCart(user.sub);
  }

  @Post("add")
  addToCart(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(user.sub, dto);
  }

  @Delete(":itemId")
  removeFromCart(@CurrentUser() user: AuthenticatedUser, @Param("itemId") itemId: string) {
    return this.cartService.removeFromCart(user.sub, itemId);
  }
}
