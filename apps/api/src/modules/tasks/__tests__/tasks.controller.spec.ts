import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksController } from '../tasks.controller';
import { TasksService } from '../tasks.service';
import { User, Task } from '../../../entities';
import {
  Role,
  TaskStatus,
  TaskCategory,
  TaskPriority,
  Permission,
} from '@task-management/data';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockOwner: Partial<User> = {
    id: 'owner-123',
    email: 'owner@example.com',
    firstName: 'Owner',
    lastName: 'User',
    role: Role.OWNER,
    organizationId: 'org-123',
  };

  const mockAdmin: Partial<User> = {
    id: 'admin-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
    organizationId: 'org-123',
  };

  const mockViewer: Partial<User> = {
    id: 'viewer-123',
    email: 'viewer@example.com',
    firstName: 'Viewer',
    lastName: 'User',
    role: Role.VIEWER,
    organizationId: 'org-123',
  };

  const mockTask: Partial<Task> = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    priority: TaskPriority.MEDIUM,
    order: 0,
    createdById: 'admin-123',
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    reorder: jest.fn(),
    getTaskStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createTaskDto = {
      title: 'New Task',
      description: 'New Description',
      category: TaskCategory.WORK,
      priority: TaskPriority.HIGH,
    };

    it('should create a task successfully for owner', async () => {
      const expectedTask = { ...mockTask, ...createTaskDto };
      mockTasksService.create.mockResolvedValue(expectedTask);

      const result = await controller.create(createTaskDto, mockOwner as User);

      expect(result).toEqual(expectedTask);
      expect(tasksService.create).toHaveBeenCalledWith(createTaskDto, mockOwner);
    });

    it('should create a task successfully for admin', async () => {
      const expectedTask = { ...mockTask, ...createTaskDto };
      mockTasksService.create.mockResolvedValue(expectedTask);

      const result = await controller.create(createTaskDto, mockAdmin as User);

      expect(result).toEqual(expectedTask);
      expect(tasksService.create).toHaveBeenCalledWith(createTaskDto, mockAdmin);
    });

    it('should pass user context to service for organization scoping', async () => {
      mockTasksService.create.mockResolvedValue(mockTask);

      await controller.create(createTaskDto, mockAdmin as User);

      expect(tasksService.create).toHaveBeenCalledWith(
        createTaskDto,
        expect.objectContaining({
          organizationId: 'org-123',
          role: Role.ADMIN,
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all accessible tasks for user', async () => {
      const tasks = [mockTask, { ...mockTask, id: 'task-456' }];
      mockTasksService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll(mockOwner as User);

      expect(result).toEqual(tasks);
      expect(tasksService.findAll).toHaveBeenCalledWith(mockOwner, {});
    });

    it('should filter tasks by status', async () => {
      mockTasksService.findAll.mockResolvedValue([mockTask]);

      await controller.findAll(mockOwner as User, TaskStatus.TODO);

      expect(tasksService.findAll).toHaveBeenCalledWith(mockOwner, {
        status: TaskStatus.TODO,
        category: undefined,
        priority: undefined,
        search: undefined,
      });
    });

    it('should filter tasks by category', async () => {
      mockTasksService.findAll.mockResolvedValue([mockTask]);

      await controller.findAll(
        mockOwner as User,
        undefined,
        TaskCategory.WORK
      );

      expect(tasksService.findAll).toHaveBeenCalledWith(mockOwner, {
        status: undefined,
        category: TaskCategory.WORK,
        priority: undefined,
        search: undefined,
      });
    });

    it('should filter tasks by priority', async () => {
      mockTasksService.findAll.mockResolvedValue([mockTask]);

      await controller.findAll(
        mockOwner as User,
        undefined,
        undefined,
        TaskPriority.HIGH
      );

      expect(tasksService.findAll).toHaveBeenCalledWith(mockOwner, {
        status: undefined,
        category: undefined,
        priority: TaskPriority.HIGH,
        search: undefined,
      });
    });

    it('should filter tasks by search term', async () => {
      mockTasksService.findAll.mockResolvedValue([mockTask]);

      await controller.findAll(
        mockOwner as User,
        undefined,
        undefined,
        undefined,
        'search term'
      );

      expect(tasksService.findAll).toHaveBeenCalledWith(mockOwner, {
        status: undefined,
        category: undefined,
        priority: undefined,
        search: 'search term',
      });
    });

    it('should combine multiple filters', async () => {
      mockTasksService.findAll.mockResolvedValue([mockTask]);

      await controller.findAll(
        mockOwner as User,
        TaskStatus.IN_PROGRESS,
        TaskCategory.URGENT,
        TaskPriority.HIGH,
        'important'
      );

      expect(tasksService.findAll).toHaveBeenCalledWith(mockOwner, {
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.URGENT,
        priority: TaskPriority.HIGH,
        search: 'important',
      });
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('task-123', mockOwner as User);

      expect(result).toEqual(mockTask);
      expect(tasksService.findOne).toHaveBeenCalledWith('task-123', mockOwner);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTasksService.findOne.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(
        controller.findOne('non-existent', mockOwner as User)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when accessing task from different org', async () => {
      mockTasksService.findOne.mockRejectedValue(
        new ForbiddenException('Access denied to this task')
      );

      await expect(
        controller.findOne('task-other-org', mockViewer as User)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateTaskDto = {
      title: 'Updated Task',
      status: TaskStatus.IN_PROGRESS,
    };

    it('should update a task successfully', async () => {
      const updatedTask = { ...mockTask, ...updateTaskDto };
      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(
        'task-123',
        updateTaskDto,
        mockOwner as User
      );

      expect(result).toEqual(updatedTask);
      expect(tasksService.update).toHaveBeenCalledWith(
        'task-123',
        updateTaskDto,
        mockOwner
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTasksService.update.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(
        controller.update('non-existent', updateTaskDto, mockOwner as User)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when viewer tries to update', async () => {
      mockTasksService.update.mockRejectedValue(
        new ForbiddenException('Viewers cannot update tasks')
      );

      await expect(
        controller.update('task-123', updateTaskDto, mockViewer as User)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      mockTasksService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('task-123', mockOwner as User);

      expect(result).toEqual({ message: 'Task deleted successfully' });
      expect(tasksService.remove).toHaveBeenCalledWith('task-123', mockOwner);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTasksService.remove.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(
        controller.remove('non-existent', mockOwner as User)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when viewer tries to delete', async () => {
      mockTasksService.remove.mockRejectedValue(
        new ForbiddenException('Viewers cannot delete tasks')
      );

      await expect(
        controller.remove('task-123', mockViewer as User)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when admin tries to delete task in child org', async () => {
      mockTasksService.remove.mockRejectedValue(
        new ForbiddenException('Admins can only modify tasks in their own organization')
      );

      await expect(
        controller.remove('task-child-org', mockAdmin as User)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reorder', () => {
    it('should reorder task within same status', async () => {
      const reorderDto = {
        taskId: 'task-123',
        newOrder: 2,
      };
      const reorderedTask = { ...mockTask, order: 2 };
      mockTasksService.reorder.mockResolvedValue(reorderedTask);

      const result = await controller.reorder(reorderDto, mockOwner as User);

      expect(result).toEqual(reorderedTask);
      expect(tasksService.reorder).toHaveBeenCalledWith(reorderDto, mockOwner);
    });

    it('should reorder task to different status (drag-drop between columns)', async () => {
      const reorderDto = {
        taskId: 'task-123',
        newOrder: 0,
        newStatus: TaskStatus.IN_PROGRESS,
      };
      const reorderedTask = {
        ...mockTask,
        order: 0,
        status: TaskStatus.IN_PROGRESS,
      };
      mockTasksService.reorder.mockResolvedValue(reorderedTask);

      const result = await controller.reorder(reorderDto, mockOwner as User);

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result.order).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return task statistics', async () => {
      const stats = {
        byStatus: [
          { status: 'todo', count: '5' },
          { status: 'in_progress', count: '3' },
          { status: 'done', count: '10' },
        ],
        total: 18,
        completed: 10,
        completionRate: 55.56,
      };
      mockTasksService.getTaskStats.mockResolvedValue(stats);

      const result = await controller.getStats(mockOwner as User);

      expect(result).toEqual(stats);
      expect(tasksService.getTaskStats).toHaveBeenCalledWith(mockOwner);
    });

    it('should return scoped stats for user organization', async () => {
      const stats = { total: 5, completed: 2, completionRate: 40 };
      mockTasksService.getTaskStats.mockResolvedValue(stats);

      await controller.getStats(mockViewer as User);

      expect(tasksService.getTaskStats).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-123' })
      );
    });
  });

  describe('organization scoping', () => {
    it('should pass user with organization context for all operations', async () => {
      const userWithOrg = { ...mockAdmin, organizationId: 'specific-org-id' };

      // Test create
      await controller.create({ title: 'Test' }, userWithOrg as User);
      expect(tasksService.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ organizationId: 'specific-org-id' })
      );

      // Test findAll
      await controller.findAll(userWithOrg as User);
      expect(tasksService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'specific-org-id' }),
        expect.anything()
      );

      // Test findOne
      mockTasksService.findOne.mockResolvedValue(mockTask);
      await controller.findOne('task-123', userWithOrg as User);
      expect(tasksService.findOne).toHaveBeenCalledWith(
        'task-123',
        expect.objectContaining({ organizationId: 'specific-org-id' })
      );
    });
  });

  describe('audit logging context', () => {
    it('should include user info for audit when creating task', async () => {
      mockTasksService.create.mockResolvedValue(mockTask);

      await controller.create({ title: 'Test' }, mockAdmin as User);

      expect(tasksService.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'admin-123',
          email: 'admin@example.com',
        })
      );
    });
  });
});
