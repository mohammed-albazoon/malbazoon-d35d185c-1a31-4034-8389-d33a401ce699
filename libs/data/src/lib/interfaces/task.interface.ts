export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  URGENT = 'urgent',
  OTHER = 'other',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  order: number;
  dueDate?: Date;
  createdById: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskCreate {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface ITaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  order?: number;
  dueDate?: Date;
}

export interface ITaskFilter {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  search?: string;
}

export interface ITaskReorder {
  taskId: string;
  newOrder: number;
  newStatus?: TaskStatus;
}
