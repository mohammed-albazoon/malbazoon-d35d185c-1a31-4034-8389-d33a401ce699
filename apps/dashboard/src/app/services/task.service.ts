import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskCategory = 'work' | 'personal' | 'urgent' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  order: number;
  dueDate?: string;
  createdById: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  order?: number;
  dueDate?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  search?: string;
}

export interface TaskStats {
  byStatus: { status: string; count: string }[];
  total: number;
  completed: number;
  completionRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private api = inject(ApiService);

  private tasksSignal = signal<Task[]>([]);
  private loadingSignal = signal(false);
  private filterSignal = signal<TaskFilter>({});
  private statsSignal = signal<TaskStats | null>(null);

  readonly tasks = this.tasksSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly filter = this.filterSignal.asReadonly();
  readonly stats = this.statsSignal.asReadonly();

  readonly todoTasks = computed(() =>
    this.tasksSignal().filter(t => t.status === 'todo').sort((a, b) => a.order - b.order)
  );

  readonly inProgressTasks = computed(() =>
    this.tasksSignal().filter(t => t.status === 'in_progress').sort((a, b) => a.order - b.order)
  );

  readonly doneTasks = computed(() =>
    this.tasksSignal().filter(t => t.status === 'done').sort((a, b) => a.order - b.order)
  );

  loadTasks(filter: TaskFilter = {}): Observable<Task[]> {
    this.loadingSignal.set(true);
    this.filterSignal.set(filter);

    return this.api.get<Task[]>('/tasks', filter).pipe(
      tap(tasks => {
        this.tasksSignal.set(tasks);
        this.loadingSignal.set(false);
      })
    );
  }

  loadStats(): Observable<TaskStats> {
    return this.api.get<TaskStats>('/tasks/stats').pipe(
      tap(stats => this.statsSignal.set(stats))
    );
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.api.post<Task>('/tasks', task).pipe(
      tap(newTask => {
        this.tasksSignal.update(tasks => [...tasks, newTask]);
      })
    );
  }

  updateTask(id: string, updates: UpdateTaskDto): Observable<Task> {
    return this.api.put<Task>(`/tasks/${id}`, updates).pipe(
      tap(updatedTask => {
        this.tasksSignal.update(tasks =>
          tasks.map(t => t.id === id ? updatedTask : t)
        );
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.api.delete<void>(`/tasks/${id}`).pipe(
      tap(() => {
        this.tasksSignal.update(tasks => tasks.filter(t => t.id !== id));
      })
    );
  }

  reorderTask(taskId: string, newOrder: number, newStatus?: TaskStatus): Observable<Task> {
    return this.api.put<Task>(`/tasks/${taskId}/reorder`, { taskId, newOrder, newStatus }).pipe(
      tap(() => {
        // Reload tasks to get updated order
        this.loadTasks(this.filterSignal()).subscribe();
      })
    );
  }

  setFilter(filter: TaskFilter): void {
    this.filterSignal.set(filter);
    this.loadTasks(filter).subscribe();
  }
}
