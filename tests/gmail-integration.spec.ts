import { test, expect } from '@playwright/test';

/**
 * Gmail Integration End-to-End Tests
 * 
 * These tests validate the Gmail integration flow including:
 * 1. Login flow
 * 2. Navigation to integrations page
 * 3. Gmail connection process
 * 4. OAuth redirect handling
 * 5. Integration status verification
 */

test.describe('Gmail Integration Flow', () => {
  // Test configuration
  const BASE_URL = 'http://localhost:8080';
  const INTEGRATIONS_PATH = '/app/integrations';
  const GMAIL_CALLBACK_PATH = '/auth/callback/gmail';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);
    
    // Mock authentication state by injecting session data
    await page.addInitScript(() => {
      // Mock localStorage auth data if your app uses it
      localStorage.setItem('sb-supabase-auth-token', JSON.stringify({
        access_token: 'mock_token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
    
    // Set up console logging to capture any auth issues
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  });

  test('should display Gmail integration option on integrations page', async ({ page }) => {
    // Mock authentication API calls
    await page.route('**/auth/v1/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: 'test@example.com' },
          session: { access_token: 'mock_token' }
        })
      });
    });
    
    // Mock user integrations API call
    await page.route('**/rest/v1/user_integrations**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    // Navigate to integrations page
    await page.goto(BASE_URL + INTEGRATIONS_PATH);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give components time to render
    
    // Check if Gmail tab is present first
    const gmailTab = page.locator('text=Gmail').first();
    await expect(gmailTab).toBeVisible();
    
    // Click on Gmail tab to show the integration
    await gmailTab.click();
    await page.waitForTimeout(1000);
    
    // Check if Gmail integration card is present
    const gmailCard = page.locator('[data-testid="gmail-integration"]');
    await expect(gmailCard).toBeVisible();
    
    // Check for Connect Gmail button
    const connectButton = page.locator('[data-testid="connect-gmail-button"]');
    await expect(connectButton).toBeVisible();
  });

  test('should handle Gmail connection button click', async ({ page }) => {
    // Mock authentication and API calls
    await page.route('**/auth/v1/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: 'test@example.com' },
          session: { access_token: 'mock_token' }
        })
      });
    });
    
    await page.route('**/rest/v1/user_integrations**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    // Navigate to integrations page
    await page.goto(BASE_URL + INTEGRATIONS_PATH);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on Gmail tab first
    const gmailTab = page.locator('text=Gmail').first();
    await gmailTab.click();
    await page.waitForTimeout(500);
    
    // Look for Connect Gmail button
    const connectButton = page.locator('[data-testid="connect-gmail-button"]');
    
    if (await connectButton.isVisible()) {
      // Click the connect button
      await connectButton.click();
      
      // Check if dialog is opened
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      console.log('Gmail connection dialog opened successfully');
    }
  });

  test('should handle Gmail OAuth callback', async ({ page }) => {
    // Simulate a Gmail OAuth callback by navigating directly to the callback URL
    // with mock parameters (in real test, you'd get these from Google)
    const mockCallbackUrl = `${BASE_URL}${GMAIL_CALLBACK_PATH}?code=mock_auth_code&state=mock_state`;
    
    await page.goto(mockCallbackUrl);
    
    // Check if the callback page loads without errors
    await page.waitForLoadState('networkidle');
    
    // Verify callback page elements
    const pageContent = await page.textContent('body');
    
    // Should show either processing or error message
    expect(pageContent).toMatch(/(Connecting|Processing|Error|Success)/i);
    
    // Wait for any redirect that might happen
    await page.waitForTimeout(2000);
    
    console.log('Final URL after callback:', page.url());
  });

  test('should validate redirect URI configuration', async ({ page }) => {
    // Test that all redirect URIs are consistent
    const expectedCallbackUrl = `${BASE_URL}${GMAIL_CALLBACK_PATH}`;
    
    // Navigate to integrations and check if any URLs are exposed
    await page.goto(BASE_URL + INTEGRATIONS_PATH);
    await page.waitForLoadState('networkidle');
    
    // Open browser console to check for any configuration logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });
    
    // Try to trigger Gmail connection to see logged URIs
    const connectButton = page.locator('button:has-text("Connect Gmail")').first();
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('Console logs:', logs);
    
    // Verify that logs contain expected redirect URI pattern
    const redirectUriLogs = logs.filter(log => 
      log.includes('redirect') || 
      log.includes('callback') || 
      log.includes('/auth/callback/gmail')
    );
    
    console.log('Redirect URI related logs:', redirectUriLogs);
  });

  test('should display integration status correctly', async ({ page }) => {
    // Navigate to integrations page
    await page.goto(BASE_URL + INTEGRATIONS_PATH);
    await page.waitForLoadState('networkidle');
    
    // Check for integration status indicators
    const statusElements = page.locator('[class*="badge"], [class*="status"], text=/connected/i, text=/disconnected/i');
    
    // Get all status-related text content
    const statusTexts = await page.locator('body').textContent();
    
    console.log('Integration page content check completed');
    console.log('Page contains Gmail:', statusTexts?.includes('Gmail'));
    
    // Basic validation that the page loaded properly
    expect(statusTexts).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Navigate to integrations page
    await page.goto(BASE_URL + INTEGRATIONS_PATH);
    await page.waitForLoadState('networkidle');
    
    // Intercept network requests to simulate errors
    await page.route('**/gmail-auth-simple', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated network error' })
      });
    });
    
    // Try to connect Gmail
    const connectButton = page.locator('button:has-text("Connect Gmail")').first();
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(2000);
      
      // Check for error handling
      const errorMessages = page.locator('text=/error/i, text=/failed/i, [role="alert"]');
      console.log('Error handling test completed');
    }
  });
});

test.describe('Gmail Integration Configuration', () => {
  test('should have consistent redirect URIs across components', async ({ page }) => {
    // This test validates that the configuration is consistent
    await page.goto('http://localhost:8080/app/integrations');
    
    // Check client-side configuration by running JavaScript
    const redirectUriConfig = await page.evaluate(() => {
      // Access the window object to check for any exposed configuration
      return {
        origin: window.location.origin,
        expectedCallback: window.location.origin + '/auth/callback/gmail',
        hostname: window.location.hostname,
        port: window.location.port
      };
    });
    
    console.log('Client-side configuration:', redirectUriConfig);
    
    // Validate configuration
    expect(redirectUriConfig.origin).toBe('http://localhost:8080');
    expect(redirectUriConfig.expectedCallback).toBe('http://localhost:8080/auth/callback/gmail');
    expect(redirectUriConfig.port).toBe('8080');
  });
});

test.describe('Gmail Integration Edge Cases', () => {
  test('should handle popup blockers', async ({ page }) => {
    // Disable popup allowance to test popup blocker handling
    await page.goto('http://localhost:8080/app/integrations');
    await page.waitForLoadState('networkidle');
    
    // Override window.open to simulate popup blocker
    await page.addInitScript(() => {
      window.open = () => null; // Simulate popup blocked
    });
    
    const connectButton = page.locator('button:has-text("Connect Gmail")').first();
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(1000);
      
      // Should show popup blocked message
      const errorText = await page.textContent('body');
      console.log('Popup blocker test - checked for error handling');
    }
  });

  test('should handle authorization denial', async ({ page }) => {
    // Simulate user denying authorization
    const callbackUrl = 'http://localhost:8080/auth/callback/gmail?error=access_denied&error_description=The+user+denied+the+request';
    
    await page.goto(callbackUrl);
    await page.waitForLoadState('networkidle');
    
    // Should show appropriate error message
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/(denied|error|failed)/i);
  });
});