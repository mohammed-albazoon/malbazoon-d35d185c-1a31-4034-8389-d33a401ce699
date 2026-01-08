import axios from 'axios';

const shouldSkip = process.env.SKIP_E2E_TESTS === 'true';

const describeOrSkip = shouldSkip ? describe.skip : describe;

describeOrSkip('API E2E Tests', () => {
  const baseUrl = `http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? 3000}/api`;

  describe('Health Check', () => {
    it('should return API status', async () => {
      const res = await axios.get(baseUrl);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('message');
    });
  });

  describe('Authentication', () => {
    let authToken: string;
    const testUser = {
      email: `e2e-test-${Date.now()}@example.com`,
      password: 'testPassword123',
      firstName: 'E2E',
      lastName: 'Test',
    };

    it('should register a new user', async () => {
      const res = await axios.post(`${baseUrl}/auth/register`, testUser);

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('accessToken');
      expect(res.data).toHaveProperty('user');
      expect(res.data.user.email).toBe(testUser.email);
      authToken = res.data.accessToken;
    });

    it('should login with valid credentials', async () => {
      const res = await axios.post(`${baseUrl}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accessToken');
      authToken = res.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const res = await axios.get(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.email).toBe(testUser.email);
    });

    it('should reject requests without token', async () => {
      try {
        await axios.get(`${baseUrl}/tasks`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Tasks API', () => {
    let authToken: string;
    let taskId: string;

    beforeAll(async () => {
      // Login to get token
      const loginRes = await axios.post(`${baseUrl}/auth/register`, {
        email: `e2e-tasks-${Date.now()}@example.com`,
        password: 'testPassword123',
        firstName: 'Tasks',
        lastName: 'Test',
      });
      authToken = loginRes.data.accessToken;
    });

    const authHeaders = () => ({ headers: { Authorization: `Bearer ${authToken}` } });

    it('should create a task', async () => {
      const res = await axios.post(
        `${baseUrl}/tasks`,
        {
          title: 'E2E Test Task',
          description: 'Created by E2E tests',
          category: 'work',
          priority: 'high',
          status: 'todo',
        },
        authHeaders()
      );

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data.title).toBe('E2E Test Task');
      taskId = res.data.id;
    });

    it('should list tasks', async () => {
      const res = await axios.get(`${baseUrl}/tasks`, authHeaders());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    it('should update a task', async () => {
      const res = await axios.put(
        `${baseUrl}/tasks/${taskId}`,
        {
          title: 'Updated E2E Task',
          status: 'in_progress',
        },
        authHeaders()
      );

      expect(res.status).toBe(200);
      expect(res.data.title).toBe('Updated E2E Task');
      expect(res.data.status).toBe('in_progress');
    });

    it('should get task stats', async () => {
      const res = await axios.get(`${baseUrl}/tasks/stats`, authHeaders());

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('total');
      expect(res.data).toHaveProperty('completed');
      expect(res.data).toHaveProperty('completionRate');
    });

    it('should delete a task', async () => {
      const res = await axios.delete(`${baseUrl}/tasks/${taskId}`, authHeaders());

      expect(res.status).toBe(200);
    });
  });
});
