import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService, Task, TaskStatus, TaskCategory, TaskPriority } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo' as TaskStatus,
    category: 'work' as TaskCategory,
    priority: 'medium' as TaskPriority,
    order: 0,
    createdById: 'user-123',
    organizationId: 'org-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTasks: Task[] = [
    mockTask,
    { ...mockTask, id: 'task-456', title: 'Task 2', status: 'in_progress' as TaskStatus },
    { ...mockTask, id: 'task-789', title: 'Task 3', status: 'done' as TaskStatus },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadTasks', () => {
    it('should load tasks and update signals', () => {
      service.loadTasks().subscribe((tasks) => {
        expect(tasks.length).toBe(3);
        expect(service.tasks().length).toBe(3);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should filter tasks by status in computed signals', () => {
      service.loadTasks().subscribe(() => {
        expect(service.todoTasks().length).toBe(1);
        expect(service.inProgressTasks().length).toBe(1);
        expect(service.doneTasks().length).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      req.flush(mockTasks);
    });
  });

  describe('createTask', () => {
    it('should create task and add to list', () => {
      service.createTask({ title: 'New Task' }).subscribe((task) => {
        expect(task.title).toBe('Test Task');
        expect(service.tasks().length).toBe(1);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks');
      expect(req.request.method).toBe('POST');
      req.flush(mockTask);
    });
  });

  describe('updateTask', () => {
    it('should update task in list', () => {
      // First load tasks
      service.loadTasks().subscribe();
      const loadReq = httpMock.expectOne('http://localhost:3000/api/tasks');
      loadReq.flush([mockTask]);

      // Then update
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      service.updateTask('task-123', { title: 'Updated Task' }).subscribe((task) => {
        expect(task.title).toBe('Updated Task');
      });

      const updateReq = httpMock.expectOne('http://localhost:3000/api/tasks/task-123');
      expect(updateReq.request.method).toBe('PUT');
      updateReq.flush(updatedTask);
    });
  });

  describe('deleteTask', () => {
    it('should remove task from list', () => {
      // First load tasks
      service.loadTasks().subscribe();
      const loadReq = httpMock.expectOne('http://localhost:3000/api/tasks');
      loadReq.flush([mockTask]);

      expect(service.tasks().length).toBe(1);

      // Then delete
      service.deleteTask('task-123').subscribe(() => {
        expect(service.tasks().length).toBe(0);
      });

      const deleteReq = httpMock.expectOne('http://localhost:3000/api/tasks/task-123');
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({});
    });
  });

  describe('loadStats', () => {
    it('should load and store stats', () => {
      const mockStats = {
        byStatus: [
          { status: 'todo', count: '1' },
          { status: 'done', count: '2' },
        ],
        total: 3,
        completed: 2,
        completionRate: 66.67,
      };

      service.loadStats().subscribe(() => {
        expect(service.stats()?.total).toBe(3);
        expect(service.stats()?.completionRate).toBe(66.67);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/tasks/stats');
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });
});
