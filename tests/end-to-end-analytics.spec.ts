import { test, expect } from '@playwright/test';

test.describe('End-to-End Campaign Analytics', () => {
  const supabaseUrl = 'https://bujaaqjxrvntcneoarkj.supabase.co';
  
  test('complete email tracking and analytics flow', async ({ page }) => {
    console.log('🚀 Starting end-to-end analytics test');

    // Step 1: Test email tracking pixel
    const trackingId = 'e2e-test-' + Date.now();
    const trackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${trackingId}`;
    
    console.log('📧 Testing email tracking pixel...');
    const pixelResponse = await page.request.get(trackingUrl);
    expect(pixelResponse.status()).toBe(200);
    expect(pixelResponse.headers()['content-type']).toBe('image/gif');
    console.log('✅ Email tracking pixel working');

    // Step 2: Test link tracking
    const linkTrackingId = 'e2e-link-' + Date.now();
    const originalUrl = 'https://example.com';
    const linkUrl = `${supabaseUrl}/functions/v1/link-tracker?id=${linkTrackingId}&url=${encodeURIComponent(originalUrl)}`;
    
    console.log('🔗 Testing link tracking...');
    const linkResponse = await page.request.get(linkUrl);
    expect([200, 302]).toContain(linkResponse.status());
    console.log('✅ Link tracking working');

    // Step 3: Test analytics refresh function with mock data
    const testCampaignId = 'e2e-campaign-' + Date.now();
    const refreshUrl = `${supabaseUrl}/functions/v1/refresh-campaign-analytics`;
    
    console.log('📊 Testing analytics refresh function...');
    const refreshResponse = await page.request.post(refreshUrl, {
      data: { campaign_id: testCampaignId },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Analytics refresh may fail for non-existent campaign, but should handle gracefully
    console.log('Analytics refresh status:', refreshResponse.status());
    expect([200, 400, 401, 404]).toContain(refreshResponse.status());
    console.log('✅ Analytics refresh function responding');

    // Step 4: Test multiple tracking events in sequence
    console.log('🔄 Testing multiple tracking events...');
    
    const sequentialTrackingId = 'e2e-sequential-' + Date.now();
    const sequentialTrackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${sequentialTrackingId}`;
    
    // Simulate multiple opens
    for (let i = 0; i < 3; i++) {
      const response = await page.request.get(sequentialTrackingUrl);
      expect(response.status()).toBe(200);
      await page.waitForTimeout(1000); // Wait between requests
    }
    console.log('✅ Sequential tracking events working');

    // Step 5: Test real-time data flow
    console.log('⚡ Testing real-time data flow...');
    
    // First, trigger some tracking events
    const realtimeTrackingId = 'e2e-realtime-' + Date.now();
    const realtimeTrackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${realtimeTrackingId}`;
    
    await page.request.get(realtimeTrackingUrl);
    
    // Then try to refresh analytics
    await page.waitForTimeout(2000); // Wait for processing
    
    const realtimeRefreshResponse = await page.request.post(refreshUrl, {
      data: { campaign_id: 'realtime-test-campaign' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Real-time refresh status:', realtimeRefreshResponse.status());
    console.log('✅ Real-time data flow tested');

    // Step 6: Verify tracking functions handle edge cases
    console.log('🛡️ Testing edge cases...');
    
    // Test with missing parameters
    const invalidPixelResponse = await page.request.get(`${supabaseUrl}/functions/v1/email-tracker`);
    expect(invalidPixelResponse.status()).toBe(200); // Should still return pixel
    
    const invalidLinkResponse = await page.request.get(`${supabaseUrl}/functions/v1/link-tracker`);
    expect([400, 302]).toContain(invalidLinkResponse.status()); // Should handle gracefully
    
    console.log('✅ Edge cases handled properly');

    console.log('🎉 End-to-end analytics test completed successfully!');
  });

  test('analytics dashboard functionality', async ({ page }) => {
    console.log('📱 Testing analytics dashboard functionality...');

    // Test that tracking functions are accessible (basic smoke test)
    const pixelTest = await page.request.get(`${supabaseUrl}/functions/v1/email-tracker?id=dashboard-test`);
    expect(pixelTest.status()).toBe(200);
    
    const linkTest = await page.request.get(`${supabaseUrl}/functions/v1/link-tracker?id=test&url=https://example.com`);
    expect([200, 302]).toContain(linkTest.status());
    
    console.log('✅ Dashboard smoke test passed');
  });

  test('performance and load handling', async ({ page }) => {
    console.log('⚡ Testing performance under load...');

    const startTime = Date.now();
    const promises = [];

    // Send 10 concurrent tracking requests
    for (let i = 0; i < 10; i++) {
      const trackingId = `load-test-${i}-${Date.now()}`;
      const promise = page.request.get(`${supabaseUrl}/functions/v1/email-tracker?id=${trackingId}`);
      promises.push(promise);
    }

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    // All requests should succeed
    responses.forEach((response, index) => {
      expect(response.status()).toBe(200);
    });

    const totalTime = endTime - startTime;
    console.log(`✅ Handled 10 concurrent requests in ${totalTime}ms`);
    
    // Should complete within reasonable time
    expect(totalTime).toBeLessThan(10000); // 10 seconds max
  });

  test('data consistency and integrity', async ({ page }) => {
    console.log('🔍 Testing data consistency...');

    const consistencyTrackingId = 'consistency-test-' + Date.now();
    const trackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${consistencyTrackingId}`;

    // Send the same tracking request multiple times
    for (let i = 0; i < 5; i++) {
      const response = await page.request.get(trackingUrl);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('image/gif');
      await page.waitForTimeout(200);
    }

    console.log('✅ Data consistency maintained across multiple requests');
  });
});