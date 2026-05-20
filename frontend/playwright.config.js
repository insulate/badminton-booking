import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // สร้าง admin auth state ก่อนรัน tests ที่ต้องการ auth
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/,
    },

    // Tests ที่ต้องการ auth (booking, pos, etc.) — ใช้ storageState ที่ setup สร้างไว้
    {
      name: 'admin-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      teardown: 'cleanup',
      testIgnore: /auth\.spec\.js/,
    },

    // Teardown: ลบ test users หลัง admin-authenticated จบ
    {
      name: 'cleanup',
      testMatch: /cleanup\.teardown\.js/,
    },

    // Auth flow tests (login/logout) — ไม่ใช้ pre-existing auth
    {
      name: 'auth-flows',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth\.spec\.js/,
    },
  ],

  webServer: {
    // Run both frontend and backend using root package.json script
    command: 'cd .. && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // Wait for both frontend and backend to be ready
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
