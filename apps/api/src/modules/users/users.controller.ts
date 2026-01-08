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
import { UsersService } from './users.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { User } from '../../entities';
import { CreateUserDto, UpdateUserDto, Permission } from '@task-management/data';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(Permission.USER_CREATE)
  async create(@Body() createDto: CreateUserDto, @CurrentUser() user: User) {
    return this.usersService.create(createDto, user);
  }

  @Get()
  @RequirePermissions(Permission.USER_READ)
  async findAll(@CurrentUser() user: User) {
    return this.usersService.findAll(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.USER_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.usersService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(Permission.USER_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
    @CurrentUser() user: User
  ) {
    return this.usersService.update(id, updateDto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USER_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.usersService.remove(id, user);
    return { message: 'User deleted successfully' };
  }
}
