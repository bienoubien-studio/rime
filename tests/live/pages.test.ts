import test, { expect } from '@playwright/test';

const BASE_URL = 'http://rizom.test:5173';

test.describe('Live Edit', () => {
	test('Should go to Live Panel', async ({ page }) => {
		// Navigate to the login page
		await page.goto('/login');

		const submitButton = page.locator('button[type="submit"]');
		await expect(submitButton).toBeDisabled();

		// Fill in the credentials
		const emailInput = page.locator('input[name="email"]');
		const passwordInput = page.locator('input[name="password"]');

		await emailInput.pressSequentially('admin@bienoubien.studio', { delay: 100 });
		await passwordInput.pressSequentially('a&1Aa&1A', { delay: 100 });

		await expect(submitButton).toBeEnabled();

		// Submit the form
		await submitButton.click();

		// Wait for navigation after login
		await page.waitForNavigation();

		expect(page.url()).toBe(`${BASE_URL}/panel`);

		const response = await page.goto(`/panel/pages/create`);
		expect(response?.status()).toBe(200);

		const saveButton = page.locator('.rz-page-header button[type="submit"]');
		await expect(saveButton).toBeDisabled();

		const tabAttribute = page.locator('.rz-tabs-trigger[data-value="attributes"]');
		await tabAttribute.click();
		const inputTitle = page.locator(`input.rz-input[name="title"]`);
		await inputTitle.pressSequentially('Live test', { delay: 100 });

		await expect(saveButton).toBeEnabled();
		await saveButton.click();
		await page.waitForLoadState('networkidle');

		const liveEditButton = page.locator('.rz-button-live');
		await liveEditButton.click();
		await page.waitForLoadState('networkidle');

		const liveContainer = page.locator('.rz-live-container');
		expect(liveContainer).toHaveCount(1);
	});
});
