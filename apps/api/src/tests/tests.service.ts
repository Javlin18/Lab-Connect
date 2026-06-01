import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTestDto } from "./dto/create-test.dto";
import { UpdateTestDto } from "./dto/update-test.dto";

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyActive = true) {
    const tests = await this.prisma.test.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: { createdAt: "desc" }
    });
    return {
      success: true,
      data: tests,
      message: "Tests retrieved"
    };
  }

  async findOneBySlug(slug: string) {
    const test = await this.prisma.test.findUnique({
      where: { slug }
    });

    if (!test) {
      throw new NotFoundException(`Test with slug ${slug} not found`);
    }

    return {
      success: true,
      data: test,
      message: "Test retrieved"
    };
  }

  async create(dto: CreateTestDto) {
    const test = await this.prisma.test.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        discountPrice: dto.discountPrice ?? null,
        category: dto.category,
        sampleType: dto.sampleType,
        preparationInstructions: dto.preparationInstructions,
        parameters: dto.parameters,
        turnaroundHours: dto.turnaroundHours,
        isActive: dto.isActive ?? true
      }
    });

    return {
      success: true,
      data: test,
      message: "Test created successfully"
    };
  }

  async update(id: string, dto: UpdateTestDto) {
    const existing = await this.prisma.test.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }

    const updated = await this.prisma.test.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        discountPrice: dto.discountPrice !== undefined ? dto.discountPrice : undefined,
        category: dto.category,
        sampleType: dto.sampleType,
        preparationInstructions: dto.preparationInstructions,
        parameters: dto.parameters,
        turnaroundHours: dto.turnaroundHours,
        isActive: dto.isActive
      }
    });

    return {
      success: true,
      data: updated,
      message: "Test updated successfully"
    };
  }

  async delete(id: string) {
    const existing = await this.prisma.test.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }

    await this.prisma.test.delete({
      where: { id }
    });

    return {
      success: true,
      data: { id },
      message: "Test deleted successfully"
    };
  }
}
