import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateTestDto } from "./dto/create-test.dto";
import { UpdateTestDto } from "./dto/update-test.dto";
import { TestsService } from "./tests.service";

@ApiTags("Tests")
@ApiBearerAuth()
@Controller("tests")
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Public()
  @Get()
  findAll(@Query("admin") admin?: string) {
    const onlyActive = admin !== "true";
    return this.testsService.findAll(onlyActive);
  }

  @Public()
  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.testsService.findOneBySlug(slug);
  }

  @Roles("admin")
  @Post()
  create(@Body() dto: CreateTestDto) {
    return this.testsService.create(dto);
  }

  @Roles("admin")
  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTestDto) {
    return this.testsService.update(id, dto);
  }

  @Roles("admin")
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.testsService.delete(id);
  }
}
