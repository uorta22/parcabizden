import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E konfigürasyonu.
 *
 * Sayfalar canlı bir dış API'ye (api.parcabizden.com.tr) bağlı olduğu için
 * cömert timeout değerleri kullanılıyor.
 *
 * PORT: bilerek 3000 DEĞİL. O port başka projelerin dev server'ı tarafından
 * kullanılabiliyor ve reuseExistingServer ile testler yanlış siteye bağlanır.
 * Alt alan adı yüzeyleri de bu portu kullanır (pazaryeri.localhost:PORT).
 */
export const E2E_PORT = 3210
const BASE = `http://localhost:${E2E_PORT}`
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Testler canlı PHP API'sine vuruyor ve orada rate limit var. Varsayılan
  // worker sayısıyla (çekirdek/2) sözleşme testleri 429 alıp sahte hata
  // veriyordu — API'yi değil, kendi hızımızı sınırlıyoruz.
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',

  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npm run dev -- -p ${E2E_PORT}`,
    url: BASE,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
