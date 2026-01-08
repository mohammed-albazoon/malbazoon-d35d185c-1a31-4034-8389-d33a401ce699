import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { User } from '../../entities';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  ReorderTaskDto,
  Permission,
  TaskStatus,
  TaskCategory,
  TaskPriority
} from '@task-management/data';

@Controller('tasks')
@UseGuards(PermissionsGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  @RequirePermissions(Permission.TASK_READ)
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: TaskStatus,
    @Query('category') category?: TaskCategory,
    @Query('priority') priority?: TaskPriority,
    @Query('search') search?: string
  ) {
    const filter: TaskFilterDto = { status, category, priority, search };
    return this.tasksService.findAll(user, filter);
  }

  @Get('stats')
  @RequirePermissions(Permission.TASK_READ)
  async getStats(@CurrentUser() user: User) {
    return this.tasksService.getTaskStats(user);
  }

  @Get(':id')
  @RequirePermissions(Permission.TASK_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tasksService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(Permission.TASK_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Put(':id/reorder')
  @RequirePermissions(Permission.TASK_UPDATE)
  async reorder(@Body() reorderDto: ReorderTaskDto, @CurrentUser() user: User) {
    return this.tasksService.reorder(reorderDto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.tasksService.remove(id, user);
    return { message: 'Task deleted successfully' };
  }
}
