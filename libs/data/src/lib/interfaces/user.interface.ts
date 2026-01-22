/**
 * Role Enum - Defines the three user roles in the RBAC system
 *
 * Role Hierarchy: OWNER > ADMIN > VIEWER
 * - Higher roles inherit all permissions of lower roles
 * - This hierarchy is enforced in getRoleHierarchy() function
 */
export enum Role {
  OWNER = 'owner', // Highest privilege - full system access, can delete users/orgs
  ADMIN = 'admin', // Can manage tasks and users, but cannot delete users or manage orgs
  VIEWER = 'viewer', // Read-only access - can only view tasks, users, and org info
}

/**
 * User Interface - Represents a user in the system
 * Each user belongs to one organization and has one role
 */
export interface IUser {
  id: string; // UUID primary key
  email: string; // Unique identifier for login
  firstName: string;
  lastName: string;
  role: Role; // User's role determines their permissions
  organizationId: string; // Foreign key to Organization - scopes data access
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Creation DTO - Data required to create a new user
 * Used during registration and when admin creates new team members
 */
export interface IUserCreate {
  email: string;
  password: string; // Will be hashed with bcrypt before storage
  firstName: string;
  lastName: string;
  role?: Role; // Optional - defaults to VIEWER when joining existing org
  organizationId?: string; // Optional - if not provided, creates new org and user becomes OWNER
}

/**
 * Login DTO - Credentials for authentication
 */
export interface IUserLogin {
  email: string;
  password: string;
}

/**
 * Auth Response - Returned after successful login/registration
 * Contains JWT token and sanitized user data (no password)
 */
export interface IAuthResponse {
  accessToken: string; // JWT token - include in Authorization header for all requests
  user: Omit<IUser, 'password'>; // User data without sensitive password field
}
