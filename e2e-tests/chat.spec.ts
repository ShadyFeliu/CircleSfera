import { test, expect } from '@playwright/test';

test.describe('CircleSfera Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('completes full chat flow', async ({ page, browser }) => {
    // Get a second browser context for the partner
    const partnerContext = await browser.newContext();
    const partnerPage = await partnerContext.newPage();
    await partnerPage.goto('http://localhost:3000');

    // Setup both users with same interests
    await page.fill('input[placeholder*="intereses"]', 'música');
    await partnerPage.fill('input[placeholder*="intereses"]', 'música');

    // Start chat for both users
    await Promise.all([
      page.click('text=Buscar Chat'),
      partnerPage.click('text=Buscar Chat')
    ]);

    // Wait for connection
    await expect(page.locator('text=Conectado')).toBeVisible();
    await expect(partnerPage.locator('text=Conectado')).toBeVisible();

    // Send messages
    await page.fill('input[placeholder*="mensaje"]', '¡Hola!');
    await page.keyboard.press('Enter');

    await partnerPage.fill('input[placeholder*="mensaje"]', '¡Hola! ¿Cómo estás?');
    await partnerPage.keyboard.press('Enter');

    // Verify messages appear
    await expect(page.locator('.chat-message >> text=¡Hola! ¿Cómo estás?')).toBeVisible();
    await expect(partnerPage.locator('.chat-message >> text=¡Hola!')).toBeVisible();

    // Test media controls
    await page.click('button:has-text("🔊")');
    await expect(partnerPage.locator('text=Silenciado')).toBeVisible();

    await page.click('button:has-text("📷")');
    await expect(partnerPage.locator('text=Sin video')).toBeVisible();

    // Test next chat functionality
    await page.click('text=Siguiente');
    await expect(page.locator('text=Buscando un compañero')).toBeVisible();
  });

  test('handles connection errors gracefully', async ({ page }) => {
    // Simulate offline condition
    await page.route('**/*', route => route.abort());
    
    await page.fill('input[placeholder*="intereses"]', 'música');
    await page.click('text=Buscar Chat');

    await expect(page.locator('text=Error de Conexión')).toBeVisible();
    await expect(page.locator('text=Reintentando conexión')).toBeVisible();
  });

  test('enforces age filter matching', async ({ page, browser }) => {
    const partnerContext = await browser.newContext();
    const partnerPage = await partnerContext.newPage();
    
    await Promise.all([
      page.goto('http://localhost:3000'),
      partnerPage.goto('http://localhost:3000')
    ]);

    // Set different age filters
    await page.selectOption('select', '18-25');
    await partnerPage.selectOption('select', '26-35');

    await Promise.all([
      page.click('text=Buscar Chat'),
      partnerPage.click('text=Buscar Chat')
    ]);

    // Should not connect due to different age filters
    await expect(page.locator('text=Buscando un compañero')).toBeVisible({ timeout: 10000 });
  });
});
