import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export type Role = 'owner' | 'admin' | 'viewer';

export interface OrgUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: Role;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = inject(ApiService);

  private usersSignal = signal<OrgUser[]>([]);
  private loadingSignal = signal(false);

  users = this.usersSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  loadUsers(): Observable<OrgUser[]> {
    this.loadingSignal.set(true);
    return this.api.get<OrgUser[]>('/users').pipe(
      tap({
        next: (users) => {
          this.usersSignal.set(users);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false),
      })
    );
  }

  createUser(dto: CreateUserDto): Observable<OrgUser> {
    return this.api.post<OrgUser>('/users', dto).pipe(
      tap((user) => {
        this.usersSignal.update((users) => [user, ...users]);
      })
    );
  }

  updateUser(id: string, dto: UpdateUserDto): Observable<OrgUser> {
    return this.api.put<OrgUser>(`/users/${id}`, dto).pipe(
      tap((updatedUser) => {
        this.usersSignal.update((users) =>
          users.map((u) => (u.id === id ? updatedUser : u))
        );
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete<void>(`/users/${id}`).pipe(
      tap(() => {
        this.usersSignal.update((users) => users.filter((u) => u.id !== id));
      })
    );
  }
}
