import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let router: Router;

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

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty email and password fields', () => {
      expect(component.email).toBe('');
      expect(component.password).toBe('');
    });

    it('should not be loading initially', () => {
      expect(component.loading()).toBe(false);
    });

    it('should have no error initially', () => {
      expect(component.error()).toBe('');
    });
  });

  describe('form rendering', () => {
    it('should render email input field', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emailInput = compiled.querySelector('input[name="email"]');
      expect(emailInput).toBeTruthy();
      expect(emailInput?.getAttribute('type')).toBe('email');
    });

    it('should render password input field', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const passwordInput = compiled.querySelector('input[name="password"]');
      expect(passwordInput).toBeTruthy();
      expect(passwordInput?.getAttribute('type')).toBe('password');
    });

    it('should render submit button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      expect(submitButton?.textContent).toContain('Sign in');
    });

    it('should render link to registration page', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const registerLink = compiled.querySelector('a[href="/register"]');
      expect(registerLink).toBeTruthy();
      expect(registerLink?.textContent).toContain('create a new account');
    });
  });

  describe('form validation', () => {
    it('should show error when submitting with empty email', () => {
      component.email = '';
      component.password = 'password123';

      component.onSubmit();

      expect(component.error()).toBe('Please fill in all fields');
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should show error when submitting with empty password', () => {
      component.email = 'test@example.com';
      component.password = '';

      component.onSubmit();

      expect(component.error()).toBe('Please fill in all fields');
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should show error when both fields are empty', () => {
      component.email = '';
      component.password = '';

      component.onSubmit();

      expect(component.error()).toBe('Please fill in all fields');
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });
  });

  describe('successful login', () => {
    beforeEach(() => {
      authServiceMock.login.mockReturnValue(of(mockAuthResponse));
    });

    it('should call authService.login with credentials', () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      component.onSubmit();

      expect(authServiceMock.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      component.email = 'test@example.com';
      component.password = 'password123';

      component.onSubmit();
      await fixture.whenStable();

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should clear error on submit', () => {
      component.error.set('Previous error');
      component.email = 'test@example.com';
      component.password = 'password123';

      component.onSubmit();

      expect(component.error()).toBe('');
    });
  });

  describe('failed login', () => {
    it('should display error message on invalid credentials', async () => {
      authServiceMock.login.mockReturnValue(
        throwError(() => ({
          error: { message: 'Invalid credentials' },
        }))
      );

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();
      await fixture.whenStable();

      expect(component.error()).toBe('Invalid credentials');
      expect(component.loading()).toBe(false);
    });

    it('should display generic error when no message in response', async () => {
      authServiceMock.login.mockReturnValue(
        throwError(() => ({ error: {} }))
      );

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();
      await fixture.whenStable();

      expect(component.error()).toBe('Invalid credentials');
    });

    it('should set loading to false on error', async () => {
      authServiceMock.login.mockReturnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();
      await fixture.whenStable();

      expect(component.loading()).toBe(false);
    });

    it('should not navigate on failed login', async () => {
      authServiceMock.login.mockReturnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      component.email = 'test@example.com';
      component.password = 'wrongpassword';

      component.onSubmit();
      await fixture.whenStable();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('UI states', () => {
    it('should display error message when error is set', () => {
      component.error.set('Test error message');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorDiv = compiled.querySelector('.bg-red-100');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent).toContain('Test error message');
    });

    it('should not display error message when error is empty', () => {
      component.error.set('');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorDiv = compiled.querySelector('.bg-red-100');
      expect(errorDiv).toBeFalsy();
    });

    it('should disable submit button when loading', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
    });

    it('should show "Signing in..." text when loading', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]');
      expect(submitButton?.textContent).toContain('Signing in...');
    });

    it('should show "Sign in" text when not loading', () => {
      component.loading.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]');
      expect(submitButton?.textContent).toContain('Sign in');
    });
  });
});
