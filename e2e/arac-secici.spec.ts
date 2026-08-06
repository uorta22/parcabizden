import { test, expect, type Page } from '@playwright/test'

/**
 * Araç seçici modal — otoparcasan tarzı 3 adımlı stepper.
 *
 * ESKİ HATALAR:
 *  - Araç sayfasının başlığında gerçek araç adı yerine "KType 18465" yazıyordu.
 *  - Mobil viewport'ta modal içindeki adım göstergesi tamamen gizliydi.
 */

/** Modalın sağ paneli — birden fazla <main> landmark'ından modala ait olanı seçer. */
function modalPanel(page: Page) {
  return page.locator('main').last()
}

async function openPicker(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Aracımı Seç' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Aracınıza Uyumlu Parçaları Seçin' })).toBeVisible()
}

test('marka → model → varyant seçip araç sayfasına gidiyor', async ({ page }) => {
  await openPicker(page)
  const panel = modalPanel(page)

  // ── Adım 1: Marka ──
  await panel.getByPlaceholder('Filtrele..').fill('BMW')
  const bmwButton = panel.getByRole('button').filter({ has: page.locator('span', { hasText: /^BMW$/ }) })
  await expect(bmwButton).toBeVisible()
  await bmwButton.click()

  // ── Adım 2: Model ──
  await expect(panel.getByText('BMW — Model Seçiniz')).toBeVisible()
  await panel.getByPlaceholder('Filtrele..').fill('3 (E46)')
  const modelButton = panel.getByRole('button').filter({ has: page.locator('span', { hasText: /^3 \(E46\)$/ }) })
  await expect(modelButton).toBeVisible()
  await modelButton.click()

  // ── Adım 3: Varyant ──
  await expect(panel.getByText('3 (E46) — Varyant Seçiniz')).toBeVisible()
  const firstVariant = panel.locator('li button').first()
  await expect(firstVariant).toBeVisible()
  await firstVariant.click()

  // ── "Aracı Seç" ──
  await page.getByRole('button', { name: 'Aracı Seç' }).click()
  await page.waitForURL(/\/arac\/\d+/)

  const url = new URL(page.url())
  expect(url.pathname).toMatch(/\/arac\/\d+/)
  expect(url.searchParams.get('b')).toBeTruthy()
  expect(url.searchParams.get('m')).toBeTruthy()
  expect(url.searchParams.get('v')).toBeTruthy()

  const h1 = page.getByRole('heading', { level: 1 })
  await expect(h1).toBeVisible()
  await expect(h1).toContainText(/^BMW 3 \(E46\)/)
  await expect(h1).not.toContainText(/KType \d+/)
})

test.describe('mobil viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('modal içindeki adım göstergesi mobilde görünür', async ({ page }) => {
    await openPicker(page)

    const mobileStepper = page.locator('ol').filter({ hasText: 'Marka' }).first()
    await expect(mobileStepper).toBeVisible()
    await expect(mobileStepper.getByText('Marka')).toBeVisible()
    await expect(mobileStepper.getByText('Model')).toBeVisible()
    await expect(mobileStepper.getByText('Varyant')).toBeVisible()
  })
})
