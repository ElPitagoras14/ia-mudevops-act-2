import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 30000,
  webServer: [
    {
      command: 'cd ../backend && uv run uvicorn app.main:app',
      port: 8000,
      timeout: 30000,
      reuseExistingServer: true,
    },
    {
      command: 'pnpm run dev',
      port: 3000,
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
})
