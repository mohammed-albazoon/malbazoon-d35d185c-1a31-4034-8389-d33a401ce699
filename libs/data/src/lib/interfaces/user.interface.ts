export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  organizationId?: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  user: Omit<IUser, 'password'>;
}
