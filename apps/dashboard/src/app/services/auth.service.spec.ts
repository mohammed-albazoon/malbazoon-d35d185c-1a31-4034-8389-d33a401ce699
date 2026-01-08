import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerMock: any;

  const mockAuthResponse = {
    accessToken: 'mock-jwt-token',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'owner' as const,
      organizationId: 'org-123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn(),
    };

    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login and store token', () => {
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe((response) => {
        expect(response.accessToken).toBe('mock-jwt-token');
        expect(service.isAuthenticated()).toBe(true);
        expect(service.user()?.email).toBe('test@example.com');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);
    });

    it('should store token in localStorage', () => {
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe(() => {
        expect(localStorage.getItem('token')).toBe('mock-jwt-token');
        expect(localStorage.getItem('user')).toBeTruthy();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockAuthResponse);
    });
  });

  describe('register', () => {
    it('should register new user and store token', () => {
      service.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      }).subscribe((response) => {
        expect(response.accessToken).toBe('mock-jwt-token');
        expect(service.isAuthenticated()).toBe(true);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should clear auth state and redirect to login', () => {
      // First set up auth state via login
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockAuthResponse);

      // Now logout
      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('role checks after login', () => {
    it('should correctly identify owner role', () => {
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(mockAuthResponse);

      expect(service.isOwner()).toBe(true);
      expect(service.isAdmin()).toBe(true);
    });

    it('should correctly identify admin role', () => {
      const adminResponse = {
        ...mockAuthResponse,
        user: { ...mockAuthResponse.user, role: 'admin' as const },
      };

      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(adminResponse);

      expect(service.isOwner()).toBe(false);
      expect(service.isAdmin()).toBe(true);
    });

    it('should correctly identify viewer role', () => {
      const viewerResponse = {
        ...mockAuthResponse,
        user: { ...mockAuthResponse.user, role: 'viewer' as const },
      };

      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
      req.flush(viewerResponse);

      expect(service.isOwner()).toBe(false);
      expect(service.isAdmin()).toBe(false);
    });
  });
});
