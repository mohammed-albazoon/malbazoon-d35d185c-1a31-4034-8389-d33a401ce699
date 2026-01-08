import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService, User } from '../../services/auth.service';
import { TaskService, Task, TaskStats } from '../../services/task.service';
import { ThemeService } from '../../services/theme.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authServiceMock: any;
  let taskServiceMock: any;
  let themeServiceMock: any;

  const mockUser: User = {
    id: 'user-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    organizationId: 'org-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      category: 'work',
      priority: 'high',
      order: 0,
      createdById: 'user-123',
      organizationId: 'org-123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'task-2',
      title: 'Task 2',
      description: 'Description 2',
      status: 'in_progress',
      category: 'personal',
      priority: 'medium',
      order: 0,
      createdById: 'user-123',
      organizationId: 'org-123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'task-3',
      title: 'Task 3',
      description: 'Description 3',
      status: 'done',
      category: 'urgent',
      priority: 'low',
      order: 0,
      createdById: 'user-123',
      organizationId: 'org-123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockStats: TaskStats = {
    byStatus: [
      { status: 'todo', count: '1' },
      { status: 'in_progress', count: '1' },
      { status: 'done', count: '1' },
    ],
    total: 3,
    completed: 1,
    completionRate: 33.33,
  };

  beforeEach(async () => {
    // Create mock signals for TaskService
    const tasksSignal = signal<Task[]>(mockTasks);
    const statsSignal = signal<TaskStats | null>(mockStats);
    const loadingSignal = signal(false);
    const filterSignal = signal({});

    taskServiceMock = {
      tasks: tasksSignal.asReadonly(),
      stats: statsSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      filter: filterSignal.asReadonly(),
      todoTasks: computed(() => tasksSignal().filter(t => t.status === 'todo').sort((a, b) => a.order - b.order)),
      inProgressTasks: computed(() => tasksSignal().filter(t => t.status === 'in_progress').sort((a, b) => a.order - b.order)),
      doneTasks: computed(() => tasksSignal().filter(t => t.status === 'done').sort((a, b) => a.order - b.order)),
      loadTasks: vi.fn().mockReturnValue(of(mockTasks)),
      loadStats: vi.fn().mockReturnValue(of(mockStats)),
      createTask: vi.fn().mockReturnValue(of(mockTasks[0])),
      updateTask: vi.fn().mockReturnValue(of(mockTasks[0])),
      deleteTask: vi.fn().mockReturnValue(of(undefined)),
      reorderTask: vi.fn().mockReturnValue(of(mockTasks[0])),
      setFilter: vi.fn(),
    };

    // Create mock signals for AuthService
    const userSignal = signal<User | null>(mockUser);
    const tokenSignal = signal<string | null>('mock-token');

    authServiceMock = {
      user: userSignal.asReadonly(),
      token: tokenSignal.asReadonly(),
      isAuthenticated: computed(() => !!tokenSignal()),
      isOwner: computed(() => userSignal()?.role === 'owner'),
      isAdmin: computed(() => ['owner', 'admin'].includes(userSignal()?.role || '')),
      logout: vi.fn(),
    };

    // Create mock for ThemeService
    const darkModeSignal = signal(false);
    themeServiceMock = {
      darkMode: darkModeSignal.asReadonly(),
      toggleTheme: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule, DragDropModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: TaskService, useValue: taskServiceMock },
        { provide: ThemeService, useValue: themeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load tasks on init', () => {
      expect(taskServiceMock.loadTasks).toHaveBeenCalled();
    });

    it('should load stats on init', () => {
      expect(taskServiceMock.loadStats).toHaveBeenCalled();
    });
  });

  describe('header rendering', () => {
    it('should display the dashboard title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('h1');
      expect(title?.textContent).toContain('Task Dashboard');
    });

    it('should display user name', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Admin');
      expect(compiled.textContent).toContain('User');
    });

    it('should display user role badge', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('ADMIN');
    });

    it('should render theme toggle button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const themeButton = compiled.querySelector('button');
      expect(themeButton).toBeTruthy();
    });

    it('should render logout button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const logoutButton = Array.from(compiled.querySelectorAll('button'))
        .find(btn => btn.textContent?.includes('Logout'));
      expect(logoutButton).toBeTruthy();
    });
  });

  describe('statistics panel', () => {
    it('should display total tasks count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Total Tasks');
      expect(compiled.textContent).toContain('3');
    });

    it('should display completed tasks count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Completed');
      expect(compiled.textContent).toContain('1');
    });

    it('should display completion rate', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Completion Rate');
      expect(compiled.textContent).toContain('33%');
    });

    it('should render progress bar', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const progressBar = compiled.querySelector('.bg-blue-600.h-4.rounded-full');
      expect(progressBar).toBeTruthy();
    });
  });

  describe('filters', () => {
    it('should render category filter dropdown', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const categorySelect = compiled.querySelector('select');
      expect(categorySelect).toBeTruthy();
    });

    it('should render search input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const searchInput = compiled.querySelector('input[placeholder="Search tasks..."]');
      expect(searchInput).toBeTruthy();
    });

    it('should apply filters when category changes', () => {
      component.filterCategory = 'work';
      component.applyFilters();

      expect(taskServiceMock.setFilter).toHaveBeenCalledWith({
        category: 'work',
        priority: undefined,
        search: undefined,
      });
    });

    it('should apply filters when priority changes', () => {
      component.filterPriority = 'high';
      component.applyFilters();

      expect(taskServiceMock.setFilter).toHaveBeenCalledWith({
        category: undefined,
        priority: 'high',
        search: undefined,
      });
    });

    it('should apply filters when search query changes', () => {
      component.searchQuery = 'test';
      component.applyFilters();

      expect(taskServiceMock.setFilter).toHaveBeenCalledWith({
        category: undefined,
        priority: undefined,
        search: 'test',
      });
    });
  });

  describe('kanban board', () => {
    it('should render three columns', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('To Do');
      expect(compiled.textContent).toContain('In Progress');
      expect(compiled.textContent).toContain('Done');
    });

    it('should display task count for each column', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('To Do (1)');
      expect(compiled.textContent).toContain('In Progress (1)');
      expect(compiled.textContent).toContain('Done (1)');
    });

    it('should render task cards', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Task 1');
      expect(compiled.textContent).toContain('Task 2');
      expect(compiled.textContent).toContain('Task 3');
    });

    it('should display task descriptions', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Description 1');
    });
  });

  describe('admin features', () => {
    it('should show Add Task button for admin', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const addButton = Array.from(compiled.querySelectorAll('button'))
        .find(btn => btn.textContent?.includes('Add Task'));
      expect(addButton).toBeTruthy();
    });

    it('should show edit and delete buttons for admin', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const editButtons = Array.from(compiled.querySelectorAll('button'))
        .filter(btn => btn.textContent?.includes('Edit'));
      const deleteButtons = Array.from(compiled.querySelectorAll('button'))
        .filter(btn => btn.textContent?.includes('Delete'));

      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('task modal', () => {
    it('should not show modal initially', () => {
      expect(component.showAddModal).toBe(false);
    });

    it('should show modal when showAddModal is true', () => {
      component.showAddModal = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const modal = compiled.querySelector('.fixed.inset-0');
      expect(modal).toBeTruthy();
    });

    it('should close modal on cancel', () => {
      component.showAddModal = true;
      component.closeModal();

      expect(component.showAddModal).toBe(false);
      expect(component.editingTask).toBeNull();
    });

    it('should reset form when closing modal', () => {
      component.taskForm = {
        title: 'Test',
        description: 'Test desc',
        category: 'work',
        priority: 'high',
        status: 'in_progress',
      };
      component.closeModal();

      expect(component.taskForm.title).toBe('');
      expect(component.taskForm.category).toBe('other');
      expect(component.taskForm.priority).toBe('medium');
      expect(component.taskForm.status).toBe('todo');
    });
  });

  describe('task operations', () => {
    it('should create task when saving new task', async () => {
      component.editingTask = null;
      component.taskForm = {
        title: 'New Task',
        description: 'New Description',
        category: 'work',
        priority: 'high',
        status: 'todo',
      };

      // Capture form values before saveTask resets them
      const expectedForm = { ...component.taskForm };

      component.saveTask();
      await fixture.whenStable();

      expect(taskServiceMock.createTask).toHaveBeenCalledWith(expectedForm);
    });

    it('should update task when saving existing task', async () => {
      component.editingTask = mockTasks[0];
      component.taskForm = {
        title: 'Updated Task',
        description: 'Updated Description',
        category: 'personal',
        priority: 'medium',
        status: 'in_progress',
      };

      // Capture form values before saveTask resets them
      const expectedForm = { ...component.taskForm };

      component.saveTask();
      await fixture.whenStable();

      expect(taskServiceMock.updateTask).toHaveBeenCalledWith('task-1', expectedForm);
    });

    it('should populate form when editing task', () => {
      component.editTask(mockTasks[0]);

      expect(component.editingTask).toBe(mockTasks[0]);
      expect(component.taskForm.title).toBe('Task 1');
      expect(component.showAddModal).toBe(true);
    });

    it('should call deleteTask with confirmation', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.deleteTask('task-1');
      await fixture.whenStable();

      expect(taskServiceMock.deleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should not delete task if not confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.deleteTask('task-1');

      expect(taskServiceMock.deleteTask).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call authService.logout', () => {
      component.logout();

      expect(authServiceMock.logout).toHaveBeenCalled();
    });
  });

  describe('helper methods', () => {
    it('should return purple class for owner', () => {
      const result = component.getRoleBadgeClass('owner');
      expect(result).toContain('bg-purple-100');
    });

    it('should return blue class for admin', () => {
      const result = component.getRoleBadgeClass('admin');
      expect(result).toContain('bg-blue-100');
    });

    it('should return red class for high priority', () => {
      const result = component.getPriorityClass('high');
      expect(result).toContain('bg-red-100');
    });

    it('should return blue class for work category', () => {
      const result = component.getCategoryClass('work');
      expect(result).toContain('bg-blue-100');
    });
  });
});
