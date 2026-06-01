import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreatePackageDto } from "./dto/create-package.dto";
import { PackagesService } from "./packages.service";

@ApiTags("Packages")
@ApiBearerAuth()
@Controller("packages")
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Public()
  @Get()
  findAll(@Query("admin") admin?: string) {
    const onlyActive = admin !== "true";
    return this.packagesService.findAll(onlyActive);
  }

  @Roles("admin")
  @Post()
  create(@Body() dto: CreatePackageDto) {
    return this.packagesService.create(dto);
  }
}
