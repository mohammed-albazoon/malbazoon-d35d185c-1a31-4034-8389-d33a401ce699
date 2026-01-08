import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Task, User, Organization } from '../../entities';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  ReorderTaskDto,
  TaskStatus,
  Role,
  AuditAction
} from '@task-management/data';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly auditService: AuditService
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    // Get max order for tasks in the same status
    const maxOrderResult = await this.taskRepository
      .createQueryBuilder('task')
      .select('MAX(task.order)', 'maxOrder')
      .where('task.organizationId = :orgId', { orgId: user.organizationId })
      .andWhere('task.status = :status', { status: createTaskDto.status || TaskStatus.TODO })
      .getRawOne();

    const newOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

    const task = this.taskRepository.create({
      ...createTaskDto,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      order: newOrder,
      createdById: user.id,
      organizationId: user.organizationId,
    });

    const savedTask = await this.taskRepository.save(task);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.CREATE,
      resource: 'task',
      resourceId: savedTask.id,
      details: `Created task: ${savedTask.title}`,
    });

    return savedTask;
  }

  async findAll(user: User, filter: TaskFilterDto): Promise<Task[]> {
    // Get accessible organization IDs based on user's role and organization hierarchy
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    const where: any = {
      organizationId: In(accessibleOrgIds),
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.priority) {
      where.priority = filter.priority;
    }

    if (filter.search) {
      where.title = Like(`%${filter.search}%`);
    }

    const tasks = await this.taskRepository.find({
      where,
      relations: ['createdBy'],
      order: { status: 'ASC', order: 'ASC', createdAt: 'DESC' },
    });

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.READ,
      resource: 'task',
      details: `Listed tasks with filter: ${JSON.stringify(filter)}`,
    });

    return tasks;
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'organization'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check access
    await this.checkTaskAccess(task, user, 'read');

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

    // Check if user can edit this task
    await this.checkTaskAccess(task, user, 'update');

    Object.assign(task, {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : task.dueDate,
    });

    const updatedTask = await this.taskRepository.save(task);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.UPDATE,
      resource: 'task',
      resourceId: updatedTask.id,
      details: `Updated task: ${updatedTask.title}`,
    });

    return updatedTask;
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);

    // Check if user can delete this task
    await this.checkTaskAccess(task, user, 'delete');

    await this.taskRepository.remove(task);

    await this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      action: AuditAction.DELETE,
      resource: 'task',
      resourceId: id,
      details: `Deleted task: ${task.title}`,
    });
  }

  async reorder(reorderDto: ReorderTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(reorderDto.taskId, user);
    await this.checkTaskAccess(task, user, 'update');

    const oldStatus = task.status;
    const newStatus = reorderDto.newStatus || task.status;
    const newOrder = reorderDto.newOrder;

    // If status changed, reorder tasks in both old and new status columns
    if (oldStatus !== newStatus) {
      // Shift tasks in old status column up
      await this.taskRepository
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" - 1' })
        .where('organizationId = :orgId', { orgId: task.organizationId })
        .andWhere('status = :status', { status: oldStatus })
        .andWhere('order > :oldOrder', { oldOrder: task.order })
        .execute();

      // Shift tasks in new status column down
      await this.taskRepository
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" + 1' })
        .where('organizationId = :orgId', { orgId: task.organizationId })
        .andWhere('status = :status', { status: newStatus })
        .andWhere('order >= :newOrder', { newOrder })
        .execute();
    } else {
      // Same status, just reorder
      if (newOrder > task.order) {
        await this.taskRepository
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" - 1' })
          .where('organizationId = :orgId', { orgId: task.organizationId })
          .andWhere('status = :status', { status: task.status })
          .andWhere('order > :oldOrder', { oldOrder: task.order })
          .andWhere('order <= :newOrder', { newOrder })
          .execute();
      } else if (newOrder < task.order) {
        await this.taskRepository
          .createQueryBuilder()
          .update(Task)
          .set({ order: () => '"order" + 1' })
          .where('organizationId = :orgId', { orgId: task.organizationId })
          .andWhere('status = :status', { status: task.status })
          .andWhere('order >= :newOrder', { newOrder })
          .andWhere('order < :oldOrder', { oldOrder: task.order })
          .execute();
      }
    }

    task.order = newOrder;
    task.status = newStatus;
    return this.taskRepository.save(task);
  }

  async getTaskStats(user: User): Promise<any> {
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    const stats = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.organizationId IN (:...orgIds)', { orgIds: accessibleOrgIds })
      .groupBy('task.status')
      .getRawMany();

    const total = stats.reduce((sum, s) => sum + parseInt(s.count, 10), 0);
    const completed = stats.find((s) => s.status === TaskStatus.DONE)?.count || 0;

    return {
      byStatus: stats,
      total,
      completed: parseInt(completed, 10),
      completionRate: total > 0 ? (parseInt(completed, 10) / total) * 100 : 0,
    };
  }

  private async getAccessibleOrganizationIds(user: User): Promise<string[]> {
    const orgIds = [user.organizationId];

    // If user is Owner or Admin, they can also see child organization tasks
    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      const childOrgs = await this.organizationRepository.find({
        where: { parentId: user.organizationId },
      });
      orgIds.push(...childOrgs.map((o) => o.id));
    }

    return orgIds;
  }

  private async checkTaskAccess(task: Task, user: User, action: 'read' | 'update' | 'delete'): Promise<void> {
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    // Check if task belongs to an accessible organization
    if (!accessibleOrgIds.includes(task.organizationId)) {
      await this.auditService.log({
        userId: user.id,
        userEmail: user.email,
        action: AuditAction.ACCESS_DENIED,
        resource: 'task',
        resourceId: task.id,
        details: `Denied ${action} access to task in different organization`,
      });
      throw new ForbiddenException('Access denied to this task');
    }

    // For update/delete, check additional permissions
    if (action === 'update' || action === 'delete') {
      // Viewers can't edit/delete
      if (user.role === Role.VIEWER) {
        await this.auditService.log({
          userId: user.id,
          userEmail: user.email,
          action: AuditAction.ACCESS_DENIED,
          resource: 'task',
          resourceId: task.id,
          details: `Viewer role denied ${action} access`,
        });
        throw new ForbiddenException(`Viewers cannot ${action} tasks`);
      }

      // Admins can only edit/delete tasks in their own org (not child orgs)
      if (user.role === Role.ADMIN && task.organizationId !== user.organizationId) {
        await this.auditService.log({
          userId: user.id,
          userEmail: user.email,
          action: AuditAction.ACCESS_DENIED,
          resource: 'task',
          resourceId: task.id,
          details: `Admin denied ${action} access to child org task`,
        });
        throw new ForbiddenException('Admins can only modify tasks in their own organization');
      }
    }
  }
}
