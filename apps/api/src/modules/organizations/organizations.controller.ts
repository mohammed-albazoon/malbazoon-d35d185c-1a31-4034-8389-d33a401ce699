import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { User } from '../../entities';
import { CreateOrganizationDto, UpdateOrganizationDto, Permission } from '@task-management/data';

@Controller('organizations')
@UseGuards(PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @RequirePermissions(Permission.ORG_CREATE)
  async create(@Body() createDto: CreateOrganizationDto, @CurrentUser() user: User) {
    return this.organizationsService.create(createDto, user);
  }

  @Get()
  @RequirePermissions(Permission.ORG_READ)
  async findAll(@CurrentUser() user: User) {
    return this.organizationsService.findAll(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.ORG_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.organizationsService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(Permission.ORG_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateOrganizationDto,
    @CurrentUser() user: User
  ) {
    return this.organizationsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.ORG_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.organizationsService.remove(id, user);
    return { message: 'Organization deleted successfully' };
  }
}
