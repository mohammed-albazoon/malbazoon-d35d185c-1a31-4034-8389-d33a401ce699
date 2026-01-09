# Secure Task Management System

A full-stack task management application with role-based access control (RBAC), built using NX monorepo architecture with NestJS backend and Angular frontend.

**Live Demo:** [https://task-management-dashboard-83jv.onrender.com](https://task-management-dashboard-83jv.onrender.com)

> **Note:** The app is hosted on Render's free tier, so it may take 30-60 seconds to wake up on first visit.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Data Model](#data-model)
- [Access Control](#access-control)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Future Considerations](#future-considerations)

---

## Overview

This secure task management system allows users to manage tasks with role-based permissions. The system supports organizational hierarchy with three roles: Owner, Admin, and Viewer, each with specific permissions.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 19, TailwindCSS, Angular CDK |
| Backend | NestJS, TypeORM, SQLite |
| Authentication | JWT (JSON Web Tokens) |
| Monorepo | NX Workspace |
| State Management | Angular Signals |

---

## Features

### Core Features
- ✅ **JWT Authentication** - Secure login/registration with token-based auth
- ✅ **Role-Based Access Control (RBAC)** - Owner, Admin, Viewer roles
- ✅ **Task Management** - Full CRUD operations with permission checks
- ✅ **Kanban Board** - Drag-and-drop task management
- ✅ **Organization Hierarchy** - 2-level organization structure
- ✅ **Audit Logging** - Track all user actions

### UI Features
- ✅ **Responsive Design** - Mobile to desktop support
- ✅ **Dark/Light Mode** - Theme toggle with persistence
- ✅ **Task Filtering** - Filter by category, priority, search
- ✅ **Real-time Stats** - Task statistics cards
- ✅ **Task Distribution Bar Chart** - Visual bar chart showing task distribution by status (To Do, In Progress, Done) with percentages

---

## Architecture

### NX Monorepo Structure

```
malbazoon-d35d185c-1a31-4034-8389-d33a401ce699/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   └── src/
│   │       ├── app/            # App module & config
│   │       ├── auth/           # Authentication module
│   │       ├── entities/       # TypeORM entities
│   │       └── modules/        # Feature modules
│   │           ├── audit/      # Audit logging
│   │           ├── tasks/      # Task management
│   │           ├── users/      # User management
│   │           └── organizations/
│   └── dashboard/              # Angular Frontend
│       └── src/
│           ├── app/
│           │   ├── guards/     # Route guards
│           │   ├── interceptors/
│           │   ├── pages/      # Page components
│           │   └── services/   # API services
│           └── environments/
├── libs/
│   ├── data/                   # Shared interfaces & DTOs
│   │   └── src/lib/
│   │       ├── dto/            # Data Transfer Objects
│   │       └── interfaces/     # TypeScript interfaces
│   └── auth/                   # Shared auth utilities
└── data/                       # SQLite database
```

### Rationale

- **NX Monorepo**: Enables code sharing between frontend and backend, consistent tooling, and efficient builds
- **Shared Libraries**: `libs/data` contains interfaces and DTOs used by both apps, ensuring type safety across the stack
- **Modular Architecture**: Each feature (tasks, users, organizations) is encapsulated in its own module

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+

### Environment Setup

1. **Clone and navigate to the project:**
   ```bash
   cd malbazoon-d35d185c-1a31-4034-8389-d33a401ce699
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create or edit `.env` file in the root:
   ```env
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

   # Database Configuration
   DATABASE_PATH=data/task-management.db

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # CORS Configuration
   CORS_ORIGIN=http://localhost:4200
   ```

### Running the Application

**Terminal 1 - Start Backend:**
```bash
npx nx serve api
```
Backend runs at: `http://localhost:3000/api`

**Terminal 2 - Start Frontend:**
```bash
npx nx serve dashboard
```
Frontend runs at: `http://localhost:4200`

### Building for Production

```bash
# Build all apps
npx nx run-many -t build

# Build specific app
npx nx build api
npx nx build dashboard
```

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  Organization   │       │      User       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │◄──────│ organizationId  │
│ description     │   1:N │ email           │
│ parentId (FK)   │──┐    │ password        │
│ createdAt       │  │    │ firstName       │
│ updatedAt       │  │    │ lastName        │
└─────────────────┘  │    │ role            │
        ▲            │    │ createdAt       │
        │ self-ref   │    │ updatedAt       │
        └────────────┘    └─────────────────┘
                                  │
                                  │ 1:N
                                  ▼
┌─────────────────┐       ┌─────────────────┐
│    AuditLog     │       │      Task       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ userId (FK)     │       │ title           │
│ userEmail       │       │ description     │
│ action          │       │ status          │
│ resource        │       │ category        │
│ resourceId      │       │ priority        │
│ details         │       │ order           │
│ ipAddress       │       │ dueDate         │
│ userAgent       │       │ createdById(FK) │
│ createdAt       │       │ organizationId  │
└─────────────────┘       │ createdAt       │
                          │ updatedAt       │
                          └─────────────────┘
```

### Schema Details

#### Users
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email address |
| password | VARCHAR(255) | Bcrypt hashed password |
| firstName | VARCHAR(50) | User's first name |
| lastName | VARCHAR(50) | User's last name |
| role | ENUM | owner, admin, viewer |
| organizationId | UUID | Foreign key to organization |

#### Tasks
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(200) | Task title |
| description | VARCHAR(2000) | Optional description |
| status | ENUM | todo, in_progress, done |
| category | ENUM | work, personal, urgent, other |
| priority | ENUM | low, medium, high |
| order | INTEGER | Display order within status |
| dueDate | DATETIME | Optional due date |

---

## Access Control

### Role Hierarchy

```
Owner (highest)
  └── Admin
        └── Viewer (lowest)
```

### Permission Matrix

| Permission | Owner | Admin | Viewer |
|------------|:-----:|:-----:|:------:|
| task:create | ✅ | ✅ | ❌ |
| task:read | ✅ | ✅ | ✅ |
| task:update | ✅ | ✅ | ❌ |
| task:delete | ✅ | ✅ | ❌ |
| user:create | ✅ | ✅ | ❌ |
| user:read | ✅ | ✅ | ✅ |
| user:update | ✅ | ✅ | ❌ |
| user:delete | ✅ | ❌ | ❌ |
| org:create | ✅ | ❌ | ❌ |
| org:read | ✅ | ✅ | ✅ |
| org:update | ✅ | ❌ | ❌ |
| org:delete | ✅ | ❌ | ❌ |
| audit:read | ✅ | ✅ | ❌ |

### Implementation

Access control is implemented using:

1. **JWT Guards** - Verify authentication on all protected routes
2. **Role Guards** - Check user role against required roles
3. **Permission Guards** - Check specific permissions based on role
4. **Organization Scoping** - Users can only access data within their organization hierarchy

```typescript
// Example: Protected endpoint with permission check
@Post()
@RequirePermissions(Permission.TASK_CREATE)
async create(@Body() dto: CreateTaskDto, @CurrentUser() user: User) {
  return this.tasksService.create(dto, user);
}
```

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response 201:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "owner",
    "organizationId": "uuid"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Get Profile
```http
GET /auth/me
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  ...
}
```

### Tasks

#### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the task management system",
  "category": "work",
  "priority": "high",
  "status": "todo"
}

Response 201:
{
  "id": "uuid",
  "title": "Complete project",
  ...
}
```

#### List Tasks
```http
GET /tasks?status=todo&category=work&priority=high&search=keyword
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "uuid",
    "title": "Complete project",
    "status": "todo",
    ...
  }
]
```

#### Update Task
```http
PUT /tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "status": "in_progress"
}

Response 200:
{
  "id": "uuid",
  "title": "Updated title",
  ...
}
```

#### Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <token>

Response 200:
{
  "message": "Task deleted successfully"
}
```

#### Get Task Stats
```http
GET /tasks/stats
Authorization: Bearer <token>

Response 200:
{
  "byStatus": [
    { "status": "todo", "count": "5" },
    { "status": "in_progress", "count": "3" },
    { "status": "done", "count": "10" }
  ],
  "total": 18,
  "completed": 10,
  "completionRate": 55.56
}
```

### Audit Logs

#### Get Audit Logs (Owner/Admin only)
```http
GET /audit-log?userId=uuid&action=create&resource=task&page=1&limit=50
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userEmail": "user@example.com",
      "action": "create",
      "resource": "task",
      "resourceId": "uuid",
      "details": "Created task: Complete project",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

## Testing

### Run All Tests
```bash
npx nx run-many -t test
```

### Run Backend Tests
```bash
npx nx test api
```

### Run Frontend Tests
```bash
npx nx test dashboard
```

### Run E2E Tests
```bash
npx nx test api-e2e
```

### Run Specific Test File
```bash
npx nx test api --testFile=auth.service.spec.ts
```

### Test Coverage Summary

| Project | Test Suites | Tests | Status |
|---------|-------------|-------|--------|
| api (Backend) | 5 | 90 | ✅ |
| data (Shared lib) | 2 | 11 | ✅ |
| api-e2e (E2E) | 1 | 10 | ✅ |
| dashboard (Frontend) | 5 | 77 | ✅ |
| auth (Shared lib) | 1 | 1 | ✅ |
| **Total** | **14** | **189** | ✅ |

### Tests Cover

**Backend (90 tests)**
- `roles.guard.spec.ts` - Role-based access control validation
- `permissions.guard.spec.ts` - Permission enforcement
- `auth.service.spec.ts` - Login, register, token generation
- `tasks.service.spec.ts` - CRUD operations, filtering, access control
- `tasks.controller.spec.ts` - API endpoint validation

**Frontend (77 tests)**
- `dashboard.component.spec.ts` - Main dashboard component (37 tests)
- `login.component.spec.ts` - Login page validation (23 tests)
- `auth.service.spec.ts` - Authentication service (8 tests)
- `task.service.spec.ts` - Task state management (7 tests)
- `app.spec.ts` - App component (2 tests)

**E2E (10 tests)**
- Health check, authentication flow, task CRUD operations

**Shared Libraries (12 tests)**
- Permission logic validation, data utilities

---

## Future Considerations

### Security Enhancements

1. **JWT Refresh Tokens**
   - Implement refresh token rotation
   - Shorter access token expiry (15 min)
   - Secure refresh token storage

2. **CSRF Protection**
   - Add CSRF tokens for state-changing requests
   - SameSite cookie attributes

3. **Rate Limiting**
   - Implement rate limiting on auth endpoints
   - Prevent brute force attacks

### Scalability

1. **RBAC Caching**
   - Cache permission checks in Redis
   - Invalidate on role changes

2. **Database Migration**
   - Move from SQLite to PostgreSQL for production
   - Add database indexing for performance

3. **Advanced Role Delegation**
   - Allow owners to delegate specific permissions
   - Custom role creation

### Features

1. **Task Assignments**
   - Assign tasks to specific users
   - Email notifications

2. **Comments & Attachments**
   - Add comments to tasks
   - File attachments

3. **Recurring Tasks**
   - Create recurring task schedules

---

## License

This project is part of a technical assessment for TurboVets.

---

## Author

**Mohammed Al-Bazoon**

Built with NX, NestJS, Angular, and TailwindCSS.
