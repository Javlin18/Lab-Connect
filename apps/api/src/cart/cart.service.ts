import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AddToCartDto } from "./dto/add-to-cart.dto";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(patientId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { patientId },
      include: {
        items: {
          include: {
            test: true,
            package: {
              include: {
                tests: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { patientId },
        include: {
          items: {
            include: {
              test: true,
              package: {
                include: {
                  tests: true
                }
              }
            }
          }
        }
      });
    }

    return {
      success: true,
      data: cart,
      message: "Cart retrieved"
    };
  }

  async addToCart(patientId: string, dto: AddToCartDto) {
    if (!dto.testId && !dto.packageId) {
      throw new BadRequestException("Must provide either testId or packageId");
    }

    const { data: cart } = await this.getOrCreateCart(patientId);

    // Check if duplicate
    const duplicate = cart.items.find(
      (item) =>
        (dto.testId && item.testId === dto.testId) ||
        (dto.packageId && item.packageId === dto.packageId)
    );

    if (duplicate) {
      return {
        success: true,
        data: cart,
        message: "Item already in cart"
      };
    }

    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        testId: dto.testId ?? null,
        packageId: dto.packageId ?? null
      }
    });

    // Return fresh cart
    return this.getOrCreateCart(patientId);
  }

  async removeFromCart(patientId: string, itemId: string) {
    const { data: cart } = await this.getOrCreateCart(patientId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException("Cart item not found");
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId }
    });

    return this.getOrCreateCart(patientId);
  }

  async clearCart(patientId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { patientId }
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }
  }
}
