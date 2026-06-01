import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePackageDto } from "./dto/create-package.dto";

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyActive = true) {
    const packages = await this.prisma.package.findMany({
      where: onlyActive ? { isActive: true } : {},
      include: {
        tests: true
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      data: packages,
      message: "Packages retrieved"
    };
  }

  async create(dto: CreatePackageDto) {
    const pkg = await this.prisma.package.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        discountPrice: dto.discountPrice ?? null,
        isActive: dto.isActive ?? true,
        tests: {
          connect: dto.testIds.map((id) => ({ id }))
        }
      },
      include: {
        tests: true
      }
    });

    return {
      success: true,
      data: pkg,
      message: "Package created successfully"
    };
  }
}
