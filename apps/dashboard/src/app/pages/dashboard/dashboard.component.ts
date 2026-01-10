import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TaskService, Task, TaskStatus, TaskCategory, TaskPriority } from '../../services/task.service';
import { ThemeService } from '../../services/theme.service';
import { UserService, OrgUser, Role } from '../../services/user.service';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Task Dashboard</h1>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {{ authService.user()?.firstName }} {{ authService.user()?.lastName }}
              <span class="ml-2 px-2 py-1 text-xs rounded-full"
                    [class]="getRoleBadgeClass(authService.user()?.role)">
                {{ authService.user()?.role | uppercase }}
              </span>
            </span>
            <button (click)="themeService.toggleTheme()"
                    class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">
              {{ themeService.darkMode() ? '☀️' : '🌙' }}
            </button>
            <button (click)="logout()"
                    class="px-4 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Tab Navigation -->
        <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button (click)="activeTab = 'tasks'"
                  [class]="activeTab === 'tasks' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'"
                  class="px-4 py-2 font-medium">
            Tasks
          </button>
          @if (authService.isAdmin()) {
            <button (click)="activeTab = 'users'; loadUsers()"
                    [class]="activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'"
                    class="px-4 py-2 font-medium">
              Team Members
            </button>
          }
        </div>

        <!-- Tasks Tab -->
        @if (activeTab === 'tasks') {
          <!-- Stats -->
          @if (taskService.stats()) {
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 class="text-sm text-gray-500 dark:text-gray-400">Total Tasks</h3>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ taskService.stats()?.total }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 class="text-sm text-gray-500 dark:text-gray-400">Completed</h3>
                <p class="text-2xl font-bold text-green-600">{{ taskService.stats()?.completed }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 class="text-sm text-gray-500 dark:text-gray-400">Completion Rate</h3>
                <p class="text-2xl font-bold text-blue-600">{{ taskService.stats()?.completionRate?.toFixed(0) }}%</p>
              </div>
              <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 class="text-sm text-gray-500 dark:text-gray-400">Progress</h3>
                <div class="w-full bg-gray-200 rounded-full h-4 mt-2">
                  <div class="bg-blue-600 h-4 rounded-full transition-all"
                       [style.width.%]="taskService.stats()?.completionRate || 0"></div>
                </div>
              </div>
            </div>

            <!-- Task Distribution Bar Chart -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Distribution</h3>
              <div class="flex items-end justify-center gap-8 h-48">
                <!-- To Do Bar -->
                <div class="flex flex-col items-center">
                  <div class="relative flex flex-col items-center justify-end w-20 h-36">
                    <div class="w-full bg-yellow-400 rounded-t-lg transition-all duration-500 ease-out"
                         [style.height.%]="getBarHeight('todo')">
                    </div>
                    <span class="absolute -top-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {{ getStatusCount('todo') }}
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-1">
                    <span class="w-3 h-3 bg-yellow-400 rounded-full"></span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">To Do</span>
                  </div>
                </div>

                <!-- In Progress Bar -->
                <div class="flex flex-col items-center">
                  <div class="relative flex flex-col items-center justify-end w-20 h-36">
                    <div class="w-full bg-blue-400 rounded-t-lg transition-all duration-500 ease-out"
                         [style.height.%]="getBarHeight('in_progress')">
                    </div>
                    <span class="absolute -top-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {{ getStatusCount('in_progress') }}
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-1">
                    <span class="w-3 h-3 bg-blue-400 rounded-full"></span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                  </div>
                </div>

                <!-- Done Bar -->
                <div class="flex flex-col items-center">
                  <div class="relative flex flex-col items-center justify-end w-20 h-36">
                    <div class="w-full bg-green-400 rounded-t-lg transition-all duration-500 ease-out"
                         [style.height.%]="getBarHeight('done')">
                    </div>
                    <span class="absolute -top-6 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {{ getStatusCount('done') }}
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-1">
                    <span class="w-3 h-3 bg-green-400 rounded-full"></span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">Done</span>
                  </div>
                </div>
              </div>

              <!-- Percentage breakdown -->
              <div class="mt-6 flex justify-center gap-6">
                <div class="text-center">
                  <span class="text-2xl font-bold text-yellow-500">{{ getStatusPercentage('todo') }}%</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">To Do</p>
                </div>
                <div class="text-center">
                  <span class="text-2xl font-bold text-blue-500">{{ getStatusPercentage('in_progress') }}%</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
                </div>
                <div class="text-center">
                  <span class="text-2xl font-bold text-green-500">{{ getStatusPercentage('done') }}%</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Done</p>
                </div>
              </div>
            </div>
          }

          <!-- Filters and Add Task -->
          <div class="flex flex-wrap gap-4 mb-6 items-center justify-between">
            <div class="flex gap-2">
              <select [(ngModel)]="filterCategory" (change)="applyFilters()"
                      class="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm">
                <option value="">All Categories</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="urgent">Urgent</option>
                <option value="other">Other</option>
              </select>
              <select [(ngModel)]="filterPriority" (change)="applyFilters()"
                      class="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm">
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input type="text" [(ngModel)]="searchQuery" (input)="applyFilters()" placeholder="Search tasks..."
                     class="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm px-3 py-2">
            </div>
            @if (authService.isAdmin()) {
              <button (click)="showAddModal = true"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                + Add Task
              </button>
            }
          </div>

          <!-- Kanban Board -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- To Do Column -->
            <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <h2 class="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <span class="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                To Do ({{ taskService.todoTasks().length }})
              </h2>
              <div cdkDropList #todoList="cdkDropList" [cdkDropListData]="taskService.todoTasks()"
                   [cdkDropListConnectedTo]="[inProgressList, doneList]"
                   (cdkDropListDropped)="drop($event, 'todo')"
                   class="task-list min-h-[200px] space-y-2">
                @for (task of taskService.todoTasks(); track task.id) {
                  <div cdkDrag [cdkDragDisabled]="!authService.isAdmin()" class="task-item bg-white dark:bg-gray-800 p-4 rounded-lg shadow" [class.cursor-move]="authService.isAdmin()" [class.cursor-default]="!authService.isAdmin()">
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="font-medium text-gray-900 dark:text-white">{{ task.title }}</h3>
                      <span [class]="getPriorityClass(task.priority)" class="text-xs px-2 py-1 rounded">
                        {{ task.priority }}
                      </span>
                    </div>
                    @if (task.description) {
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ task.description }}</p>
                    }
                    <div class="flex justify-between items-center">
                      <span [class]="getCategoryClass(task.category)" class="text-xs px-2 py-1 rounded">
                        {{ task.category }}
                      </span>
                      @if (authService.isAdmin()) {
                        <div class="space-x-2">
                          <button (click)="editTask(task)" class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                          <button (click)="deleteTask(task.id)" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- In Progress Column -->
            <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <h2 class="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <span class="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                In Progress ({{ taskService.inProgressTasks().length }})
              </h2>
              <div cdkDropList #inProgressList="cdkDropList" [cdkDropListData]="taskService.inProgressTasks()"
                   [cdkDropListConnectedTo]="[todoList, doneList]"
                   (cdkDropListDropped)="drop($event, 'in_progress')"
                   class="task-list min-h-[200px] space-y-2">
                @for (task of taskService.inProgressTasks(); track task.id) {
                  <div cdkDrag [cdkDragDisabled]="!authService.isAdmin()" class="task-item bg-white dark:bg-gray-800 p-4 rounded-lg shadow" [class.cursor-move]="authService.isAdmin()" [class.cursor-default]="!authService.isAdmin()">
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="font-medium text-gray-900 dark:text-white">{{ task.title }}</h3>
                      <span [class]="getPriorityClass(task.priority)" class="text-xs px-2 py-1 rounded">
                        {{ task.priority }}
                      </span>
                    </div>
                    @if (task.description) {
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ task.description }}</p>
                    }
                    <div class="flex justify-between items-center">
                      <span [class]="getCategoryClass(task.category)" class="text-xs px-2 py-1 rounded">
                        {{ task.category }}
                      </span>
                      @if (authService.isAdmin()) {
                        <div class="space-x-2">
                          <button (click)="editTask(task)" class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                          <button (click)="deleteTask(task.id)" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Done Column -->
            <div class="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <h2 class="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                <span class="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                Done ({{ taskService.doneTasks().length }})
              </h2>
              <div cdkDropList #doneList="cdkDropList" [cdkDropListData]="taskService.doneTasks()"
                   [cdkDropListConnectedTo]="[todoList, inProgressList]"
                   (cdkDropListDropped)="drop($event, 'done')"
                   class="task-list min-h-[200px] space-y-2">
                @for (task of taskService.doneTasks(); track task.id) {
                  <div cdkDrag [cdkDragDisabled]="!authService.isAdmin()" class="task-item bg-white dark:bg-gray-800 p-4 rounded-lg shadow opacity-75" [class.cursor-move]="authService.isAdmin()" [class.cursor-default]="!authService.isAdmin()">
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="font-medium text-gray-900 dark:text-white line-through">{{ task.title }}</h3>
                      <span [class]="getPriorityClass(task.priority)" class="text-xs px-2 py-1 rounded">
                        {{ task.priority }}
                      </span>
                    </div>
                    @if (task.description) {
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ task.description }}</p>
                    }
                    <div class="flex justify-between items-center">
                      <span [class]="getCategoryClass(task.category)" class="text-xs px-2 py-1 rounded">
                        {{ task.category }}
                      </span>
                      @if (authService.isAdmin()) {
                        <div class="space-x-2">
                          <button (click)="deleteTask(task.id)" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Users Tab -->
        @if (activeTab === 'users' && authService.isAdmin()) {
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
              @if (authService.isOwner() || authService.isAdmin()) {
                <button (click)="showUserModal = true"
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                  + Add User
                </button>
              }
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  @for (user of userService.users(); track user.id) {
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ user.firstName }} {{ user.lastName }}
                        @if (user.id === authService.user()?.id) {
                          <span class="ml-2 text-xs text-gray-500">(You)</span>
                        }
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {{ user.email }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        @if (authService.isOwner() && user.id !== authService.user()?.id) {
                          <select [value]="user.role" (change)="changeUserRole(user.id, $event)"
                                  class="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm">
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        } @else {
                          <span [class]="getRoleBadgeClass(user.role)" class="px-2 py-1 text-xs rounded-full">
                            {{ user.role | uppercase }}
                          </span>
                        }
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        @if (authService.isOwner() && user.id !== authService.user()?.id) {
                          <button (click)="deleteUser(user.id)" class="text-red-600 hover:text-red-800">
                            Delete
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (userService.users().length === 0) {
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                No team members found. Add users to your organization.
              </div>
            }
          </div>
        }
      </main>

      <!-- Add/Edit Task Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {{ editingTask ? 'Edit Task' : 'Add New Task' }}
            </h2>
            <form (ngSubmit)="saveTask()">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input type="text" [(ngModel)]="taskForm.title" name="title" required
                         class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea [(ngModel)]="taskForm.description" name="description" rows="3"
                            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <select [(ngModel)]="taskForm.category" name="category"
                            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="urgent">Urgent</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                    <select [(ngModel)]="taskForm.priority" name="priority"
                            class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select [(ngModel)]="taskForm.status" name="status"
                          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" (click)="closeModal()"
                        class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  Cancel
                </button>
                <button type="submit"
                        class="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded">
                  {{ editingTask ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Add User Modal -->
      @if (showUserModal) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New Team Member</h2>
            <form (ngSubmit)="saveUser()">
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                    <input type="text" [(ngModel)]="userForm.firstName" name="firstName" required
                           class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                    <input type="text" [(ngModel)]="userForm.lastName" name="lastName" required
                           class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" [(ngModel)]="userForm.email" name="email" required
                         class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input type="password" [(ngModel)]="userForm.password" name="password" required minlength="8"
                         class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum 8 characters</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select [(ngModel)]="userForm.role" name="role"
                          class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    @if (authService.isOwner()) {
                      <option value="admin">Admin</option>
                    }
                    <option value="viewer">Viewer</option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    @if (authService.isOwner()) {
                      As an Owner, you can create Admins or Viewers
                    } @else {
                      As an Admin, you can only create Viewers
                    }
                  </p>
                </div>
              </div>
              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" (click)="closeUserModal()"
                        class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  Cancel
                </button>
                <button type="submit"
                        class="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  taskService = inject(TaskService);
  themeService = inject(ThemeService);
  userService = inject(UserService);
  private router = inject(Router);

  activeTab: 'tasks' | 'users' = 'tasks';

  showAddModal = false;
  editingTask: Task | null = null;
  taskForm = {
    title: '',
    description: '',
    category: 'other' as TaskCategory,
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
  };

  showUserModal = false;
  userForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'viewer' as Role,
  };

  filterCategory = '';
  filterPriority = '';
  searchQuery = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.taskService.loadTasks().subscribe();
    this.taskService.loadStats().subscribe();
  }

  loadUsers() {
    this.userService.loadUsers().subscribe();
  }

  applyFilters() {
    this.taskService.setFilter({
      category: this.filterCategory as TaskCategory || undefined,
      priority: this.filterPriority as TaskPriority || undefined,
      search: this.searchQuery || undefined,
    });
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
        next: () => this.taskService.loadStats().subscribe(),
      });
    }
  }

  editTask(task: Task) {
    this.editingTask = task;
    this.taskForm = {
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      status: task.status,
    };
    this.showAddModal = true;
  }

  saveTask() {
    if (this.editingTask) {
      this.taskService.updateTask(this.editingTask.id, this.taskForm).subscribe({
        next: () => {
          this.closeModal();
          this.taskService.loadStats().subscribe();
        },
      });
    } else {
      this.taskService.createTask(this.taskForm).subscribe({
        next: () => {
          this.closeModal();
          this.taskService.loadStats().subscribe();
        },
      });
    }
  }

  deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => this.taskService.loadStats().subscribe(),
      });
    }
  }

  closeModal() {
    this.showAddModal = false;
    this.editingTask = null;
    this.taskForm = {
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      status: 'todo',
    };
  }

  // User management
  saveUser() {
    this.userService.createUser(this.userForm).subscribe({
      next: () => {
        this.closeUserModal();
      },
      error: (err) => {
        let message = 'Failed to create user';
        if (err.error?.message) {
          // Handle array of validation errors
          if (Array.isArray(err.error.message)) {
            message = err.error.message.join('\n');
          } else {
            message = err.error.message;
          }
        }
        alert(message);
      }
    });
  }

  changeUserRole(userId: string, event: Event) {
    const role = (event.target as HTMLSelectElement).value as Role;
    this.userService.updateUser(userId, { role }).subscribe({
      error: (err) => {
        alert(err.error?.message || 'Failed to update role');
        this.loadUsers(); // Reload to reset the dropdown
      }
    });
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.userService.deleteUser(id).subscribe({
        error: (err) => {
          alert(err.error?.message || 'Failed to delete user');
        }
      });
    }
  }

  closeUserModal() {
    this.showUserModal = false;
    this.userForm = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'viewer',
    };
  }

  logout() {
    this.authService.logout();
  }

  getRoleBadgeClass(role?: string) {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityClass(priority: string) {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  }

  getCategoryClass(category: string) {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Bar chart helper methods
  getStatusCount(status: string): number {
    const stats = this.taskService.stats();
    if (!stats?.byStatus) return 0;
    const statusData = stats.byStatus.find(s => s.status === status);
    return statusData ? parseInt(statusData.count, 10) : 0;
  }

  getBarHeight(status: string): number {
    const stats = this.taskService.stats();
    if (!stats?.total || stats.total === 0) return 0;
    const count = this.getStatusCount(status);
    // Scale to percentage, minimum 5% if there's at least 1 task for visibility
    const percentage = (count / stats.total) * 100;
    return count > 0 ? Math.max(percentage, 5) : 0;
  }

  getStatusPercentage(status: string): number {
    const stats = this.taskService.stats();
    if (!stats?.total || stats.total === 0) return 0;
    const count = this.getStatusCount(status);
    return Math.round((count / stats.total) * 100);
  }
}
