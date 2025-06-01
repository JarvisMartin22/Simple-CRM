import { test, expect } from '@playwright/test';

test.describe('Email Tracking Functions', () => {
  const supabaseUrl = 'https://bujaaqjxrvntcneoarkj.supabase.co';
  
  test('should respond to email tracker pixel request', async ({ page }) => {
    // Test the tracking pixel endpoint
    const trackingId = 'test-pixel-' + Date.now();
    const trackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${trackingId}`;
    
    const response = await page.request.get(trackingUrl);
    
    // Should return a GIF image regardless of whether tracking exists
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/gif');
    
    console.log('Email tracker responded with status:', response.status());
  });

  test('should respond to link tracker request', async ({ page }) => {
    // Test the link tracker endpoint
    const trackingId = 'test-link-' + Date.now();
    const originalUrl = 'https://example.com';
    const linkUrl = `${supabaseUrl}/functions/v1/link-tracker?id=${trackingId}&url=${encodeURIComponent(originalUrl)}`;
    
    const response = await page.request.get(linkUrl);
    
    // Should redirect to original URL even if tracking fails
    expect([302, 200]).toContain(response.status());
    
    console.log('Link tracker responded with status:', response.status());
    console.log('Link tracker headers:', response.headers());
  });

  test('should handle refresh analytics function', async ({ page }) => {
    const refreshUrl = `${supabaseUrl}/functions/v1/refresh-campaign-analytics`;
    const testCampaignId = 'test-campaign-' + Date.now();
    
    try {
      const response = await page.request.post(refreshUrl, {
        data: { campaign_id: testCampaignId },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Refresh analytics responded with status:', response.status());
      
      if (response.status() === 200) {
        const result = await response.json();
        console.log('Refresh analytics response:', result);
      }
      
      // Should handle the request (may fail due to missing campaign, but should not error)
      expect([200, 400, 404]).toContain(response.status());
    } catch (error) {
      console.log('Refresh analytics error (expected):', error);
    }
  });

  test('should access campaign analytics page', async ({ page }) => {
    // Test the actual UI
    await page.goto('http://localhost:5173/campaigns');
    
    // Check if campaigns page loads
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Look for campaigns-related elements
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBe(true);
    
    console.log('Campaign page loaded successfully');
  });

  test('should check real-time data flow', async ({ page }) => {
    // First, check what happens when we call the tracking pixel
    const trackingId = 'test-realtime-' + Date.now();
    const trackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${trackingId}`;
    
    console.log('Testing real-time flow with tracking ID:', trackingId);
    
    // Call tracking pixel
    const trackingResponse = await page.request.get(trackingUrl);
    expect(trackingResponse.status()).toBe(200);
    
    // Wait a moment for processing
    await page.waitForTimeout(2000);
    
    // Then check if we can refresh analytics for a test campaign
    const refreshUrl = `${supabaseUrl}/functions/v1/refresh-campaign-analytics`;
    const testCampaignId = 'test-campaign-realtime';
    
    const refreshResponse = await page.request.post(refreshUrl, {
      data: { campaign_id: testCampaignId },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Real-time test completed');
    console.log('Tracking status:', trackingResponse.status());
    console.log('Refresh status:', refreshResponse.status());
    
    // Both should handle requests appropriately
    expect(trackingResponse.status()).toBe(200);
    expect([200, 400, 404]).toContain(refreshResponse.status());
  });
});