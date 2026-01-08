import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TasksService } from '../tasks.service';
import { Task, Organization } from '../../../entities';
import { AuditService } from '../../audit/audit.service';
import { Role, TaskStatus, TaskCategory, TaskPriority } from '@task-management/data';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;
  let organizationRepository: Repository<Organization>;
  let auditService: AuditService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: Role.OWNER,
    organizationId: 'org-123',
  };

  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    priority: TaskPriority.MEDIUM,
    order: 0,
    createdById: 'user-123',
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getRawOne: jest.fn().mockResolvedValue({ maxOrder: 0 }),
              groupBy: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask as any);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask as any);

      const result = await service.create(
        { title: 'Test Task', description: 'Test Description' },
        mockUser as any
      );

      expect(result.title).toBe('Test Task');
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return tasks for user organization', async () => {
      jest.spyOn(taskRepository, 'find').mockResolvedValue([mockTask] as any);

      const result = await service.findAll(mockUser as any, {});

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Task');
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);

      const result = await service.findOne('task-123', mockUser as any);

      expect(result.id).toBe('task-123');
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUser as any)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(updatedTask as any);

      const result = await service.update('task-123', { title: 'Updated Task' }, mockUser as any);

      expect(result.title).toBe('Updated Task');
    });

    it('should throw ForbiddenException for viewer role', async () => {
      const viewerUser = { ...mockUser, role: Role.VIEWER };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);

      await expect(
        service.update('task-123', { title: 'Updated' }, viewerUser as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(taskRepository, 'remove').mockResolvedValue(mockTask as any);

      await service.remove('task-123', mockUser as any);

      expect(taskRepository.remove).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('RBAC Access Control', () => {
    it('should allow owner to access all tasks in org', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);

      const result = await service.findOne('task-123', mockUser as any);
      expect(result).toBeDefined();
    });

    it('should deny access to tasks in different organization', async () => {
      const differentOrgTask = { ...mockTask, organizationId: 'different-org' };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(differentOrgTask as any);

      await expect(service.findOne('task-123', mockUser as any)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
