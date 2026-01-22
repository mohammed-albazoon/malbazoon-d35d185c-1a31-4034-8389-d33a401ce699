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

/**
 * TasksController - REST API endpoints for task management
 *
 * All routes in this controller require:
 * 1. Valid JWT token (enforced by global JwtAuthGuard)
 * 2. Specific permissions (enforced by PermissionsGuard)
 *
 * Request Flow for each endpoint:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Request → JwtAuthGuard → PermissionsGuard → Controller    │
 * │            (global)        (class-level)                    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Permission Matrix:
 * ┌──────────────────┬────────────┬────────────┬────────────┐
 * │ Endpoint         │ Viewer     │ Admin      │ Owner      │
 * ├──────────────────┼────────────┼────────────┼────────────┤
 * │ POST /tasks      │ ❌         │ ✓          │ ✓          │
 * │ GET /tasks       │ ✓          │ ✓          │ ✓          │
 * │ GET /tasks/:id   │ ✓          │ ✓          │ ✓          │
 * │ PUT /tasks/:id   │ ❌         │ ✓          │ ✓          │
 * │ DELETE /tasks/:id│ ❌         │ ✓          │ ✓          │
 * └──────────────────┴────────────┴────────────┴────────────┘
 */
@Controller('tasks')
@UseGuards(PermissionsGuard) // Apply PermissionsGuard to ALL routes in this controller
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks - Create a new task
   *
   * Permission: TASK_CREATE (Admin, Owner only)
   * Viewer role will get 403 Forbidden
   */
  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    // User is injected by @CurrentUser() decorator
    // Task will be assigned to user's organization
    return this.tasksService.create(createTaskDto, user);
  }

  /**
   * GET /tasks - List all accessible tasks
   *
   * Permission: TASK_READ (All roles)
   * Tasks are scoped by organization - users only see their org's tasks
   * Supports filtering by status, category, priority, and search
   */
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
    // Service will filter tasks by user's organizationId
    return this.tasksService.findAll(user, filter);
  }

  /**
   * GET /tasks/stats - Get task statistics
   *
   * Permission: TASK_READ (All roles)
   * Returns: { byStatus: {...}, total, completed, completionRate }
   */
  @Get('stats')
  @RequirePermissions(Permission.TASK_READ)
  async getStats(@CurrentUser() user: User) {
    return this.tasksService.getTaskStats(user);
  }

  /**
   * GET /tasks/:id - Get a single task by ID
   *
   * Permission: TASK_READ (All roles)
   * Service validates user has access to the task's organization
   */
  @Get(':id')
  @RequirePermissions(Permission.TASK_READ)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tasksService.findOne(id, user);
  }

  /**
   * PUT /tasks/:id - Update a task
   *
   * Permission: TASK_UPDATE (Admin, Owner only)
   * Service validates user can modify tasks in that organization
   */
  @Put(':id')
  @RequirePermissions(Permission.TASK_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User
  ) {
    return this.tasksService.update(id, updateTaskDto, user);
  }

  /**
   * PUT /tasks/:id/reorder - Reorder task (drag-drop)
   *
   * Permission: TASK_UPDATE (Admin, Owner only)
   * Updates task's order position and optionally status (column change)
   */
  @Put(':id/reorder')
  @RequirePermissions(Permission.TASK_UPDATE)
  async reorder(@Body() reorderDto: ReorderTaskDto, @CurrentUser() user: User) {
    return this.tasksService.reorder(reorderDto, user);
  }

  /**
   * DELETE /tasks/:id - Delete a task
   *
   * Permission: TASK_DELETE (Admin, Owner only)
   * Permanently removes the task from the database
   */
  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.tasksService.remove(id, user);
    return { message: 'Task deleted successfully' };
  }
}
