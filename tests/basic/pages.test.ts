import test, { expect } from '@playwright/test';

const BASE_URL = 'http://local.rizom:5173';

test('Init Form', async ({ page }) => {
	await page.goto(`${BASE_URL}/init`);
	const title = page.locator('h1');
	await expect(title).toHaveText('Error: 404');
});

test.describe('Login form', () => {
	test('should login successfully with valid credentials', async ({ page }) => {
		// Navigate to the login page
		await page.goto('/login');
		await page.waitForLoadState();

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

		// Add assertions based on successful login
		// For example, check if redirected to dashboard or check for success message
		expect(page.url()).toBe(`${BASE_URL}/panel`); // Adjust URL based on your app
	});

	test('should show error with invalid credentials', async ({ page }) => {
		await page.goto('/login');

		const submitButton = page.locator('button[type="submit"]');
		await expect(submitButton).toBeDisabled();

		// Fill in the credentials
		const emailInput = page.locator('input[name="email"]');
		const passwordInput = page.locator('input[name="password"]');

		await emailInput.pressSequentially('wrong@email.com', { delay: 100 });
		await passwordInput.pressSequentially('wrongpassword', { delay: 100 });

		await expect(submitButton).toBeEnabled();

		// Submit the form
		await submitButton.click();

		// Check for error message
		const errorMessage = page.locator('.rz-field-error'); // Adjust selector based on your error message element
		await expect(errorMessage).toBeVisible();
	});

	test('forgot password link works', async ({ page }) => {
		await page.goto('/login');
		await page.waitForNavigation();
		// Click forgot password link
		await page.click('a[href="/forgot-password?slug=users"]');
		await page.waitForNavigation();
		// Verify navigation to forgot password page
		expect(page.url()).toContain('/forgot-password');
	});

	test('forgot password form works', async ({ page }) => {
		await page.goto('/login');
		await page.waitForNavigation();
		// Click forgot password link
		await page.click('a[href="/forgot-password?slug=users"]');
		await page.fill('input[name="email"]', 'admin@bienoubien.studio');
		await page.click('button[type="submit"]');
		const message = page.locator('.rz-card-title');
		expect(message).toHaveText('Email successfully sent');
	});
});

test.describe('Admin panel', () => {
	test('Should visit all ', async ({ page }) => {
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

		const collections = [
			{ slug: 'pages', singular: 'Page', plural: 'Pages' },
			{ slug: 'medias', singular: 'Media', plural: 'Medias' },
			{ slug: 'users', singular: 'User', plural: 'Users' }
		];

		for (const { slug, singular, plural } of collections) {
			const navButton = page.locator(`a.rz-button-nav[href="/panel/${slug}"]`);
			expect(await navButton.innerText()).toBe(plural);

			let response = await page.goto(`/panel/${slug}`);
			expect(response?.status()).toBe(200);

			const createButton = page.locator(`a[href="/panel/${slug}/create"]`);
			expect(await createButton.innerText()).toBe('New ' + singular);

			response = await page.goto(`/panel/${slug}/create`);
			expect(response?.status()).toBe(200);
		}

		const globals = [{ slug: 'settings', label: 'Settings' }];

		for (const { slug, label } of globals) {
			const navButton = page.locator(`a.rz-button-nav[href="/panel/${slug}"]`);
			expect(await navButton.innerText()).toBe(label);
			const response = await page.goto(`/panel/${slug}`);
			expect(response?.status()).toBe(200);
		}

		await page.click('form.rz-logout-form button[type="submit"]');
		await page.waitForNavigation();
		expect(page.url()).toBe(`${BASE_URL}/login`);
	});
});

test.describe('Lock user', () => {
	test('should lock user after 5 login failed', async ({ page }) => {
		// Navigate to the login page
		await page.goto('/login');

		const submitButton = page.locator('button[type="submit"]');
		await expect(submitButton).toBeDisabled();

		const emailInput = page.locator('input[name="email"]');
		const passwordInput = page.locator('input[name="password"]');

		// Fill in the credentials 5 times
		for (let i = 0; i < 5; i++) {
			if (i === 0) {
				await emailInput.pressSequentially('admin@bienoubien.studio', { delay: 100 });
			}
			await passwordInput.pressSequentially('password', { delay: 100 });
			await expect(submitButton).toBeEnabled();
			// Submit the form
			await submitButton.click();
		}
		// Wait for navigation after successive login failed
		await page.waitForNavigation();
		expect(page.url()).toBe(`${BASE_URL}/locked`);
	});
});
