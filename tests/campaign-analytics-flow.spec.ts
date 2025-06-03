import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const TEST_EMAIL = 'playwright@test.com';
const TEST_PASSWORD = 'test123456';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bujaaqjxrvntcneoarkj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';

test.describe('Campaign Analytics Flow', () => {
  let campaignId: string;
  let trackingId: string;
  
  test.beforeAll(async () => {
    // Clean up any existing test data
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Sign in as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (authError) {
      console.error('Auth error:', authError);
    }
  });

  test('should track email opens and update analytics', async ({ page, request }) => {
    // Step 1: Login to the application
    await page.goto('http://localhost:8080');
    await page.click('text=Sign in');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Step 2: Navigate to campaigns
    await page.click('text=Campaigns');
    await page.waitForSelector('h1:has-text("Campaigns")');

    // Step 3: Create a new campaign
    await page.click('text=Create Campaign');
    const campaignName = `Analytics Test ${Date.now()}`;
    await page.fill('input[name="name"]', campaignName);
    await page.fill('textarea[name="description"]', 'Testing analytics tracking');
    
    // Select template
    await page.click('text=Select Template');
    await page.click('.template-option:first-child');
    
    // Select recipients
    await page.click('text=Next');
    await page.waitForSelector('text=Select Recipients');
    await page.click('input[type="checkbox"]:first-child');
    
    // Send campaign
    await page.click('text=Send Campaign');
    await page.waitForSelector('text=Campaign sent successfully');

    // Get campaign ID from URL or page
    const url = page.url();
    const campaignMatch = url.match(/campaigns\/([a-f0-9-]+)/);
    if (campaignMatch) {
      campaignId = campaignMatch[1];
      console.log('Campaign ID:', campaignId);
    }

    // Step 4: Check initial analytics
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Wait for initial email_events to be created
    await page.waitForTimeout(2000);
    
    // Check email_events table
    const { data: sentEvents, error: sentError } = await supabase
      .from('email_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('event_type', 'sent');
    
    console.log('Sent events:', sentEvents?.length);
    expect(sentEvents).toBeDefined();
    expect(sentEvents?.length).toBeGreaterThan(0);
    
    if (sentEvents && sentEvents.length > 0) {
      trackingId = sentEvents[0].tracking_id;
      console.log('Tracking ID:', trackingId);
    }

    // Step 5: Simulate email open by hitting tracking pixel
    const pixelUrl = `${SUPABASE_URL}/functions/v1/email-tracker?id=${trackingId}&type=open&campaign=${campaignId}`;
    console.log('Tracking pixel URL:', pixelUrl);
    
    const pixelResponse = await request.get(pixelUrl);
    expect(pixelResponse.status()).toBe(200);
    
    // Wait for processing
    await page.waitForTimeout(2000);

    // Step 6: Check if open event was recorded
    const { data: openEvents, error: openError } = await supabase
      .from('email_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('event_type', 'opened');
    
    console.log('Open events:', openEvents?.length);
    expect(openEvents).toBeDefined();
    expect(openEvents?.length).toBeGreaterThan(0);

    // Step 7: Check campaign_analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();
    
    console.log('Campaign analytics:', analytics);
    expect(analytics).toBeDefined();
    expect(analytics?.sent_count).toBeGreaterThan(0);
    expect(analytics?.opened_count).toBeGreaterThan(0);
    expect(analytics?.unique_opened_count).toBeGreaterThan(0);

    // Step 8: Verify analytics show in UI
    await page.goto(`http://localhost:8080/campaigns/${campaignId}`);
    await page.waitForSelector('text=Campaign Analytics');
    
    // Check if metrics are displayed
    const openedMetric = await page.locator('text=/Opened.*[0-9]+/').textContent();
    console.log('UI Opened metric:', openedMetric);
    expect(openedMetric).toContain('1'); // At least 1 open

    // Step 9: Test link click tracking
    // First, get a tracked link from the sent email
    const { data: links } = await supabase
      .from('tracked_links')
      .select('*')
      .eq('campaign_id', campaignId)
      .limit(1);
    
    if (links && links.length > 0) {
      const linkUrl = `${SUPABASE_URL}/functions/v1/link-tracker?id=${links[0].id}&url=${encodeURIComponent(links[0].original_url)}`;
      const linkResponse = await request.get(linkUrl);
      expect(linkResponse.status()).toBe(302); // Should redirect
      
      // Wait and check click events
      await page.waitForTimeout(2000);
      
      const { data: clickEvents } = await supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('event_type', 'clicked');
      
      console.log('Click events:', clickEvents?.length);
      expect(clickEvents?.length).toBeGreaterThan(0);
    }

    // Step 10: Final analytics check
    const { data: finalAnalytics } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();
    
    console.log('Final analytics:', finalAnalytics);
    expect(finalAnalytics?.opened_count).toBeGreaterThan(0);
    if (links && links.length > 0) {
      expect(finalAnalytics?.clicked_count).toBeGreaterThan(0);
    }
  });

  test('should handle multiple opens and track unique counts', async ({ request }) => {
    if (!trackingId || !campaignId) {
      test.skip();
      return;
    }

    const pixelUrl = `${SUPABASE_URL}/functions/v1/email-tracker?id=${trackingId}&type=open&campaign=${campaignId}`;
    
    // Simulate 3 opens from same tracking ID
    for (let i = 0; i < 3; i++) {
      await request.get(pixelUrl);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Check analytics
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: analytics } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();
    
    console.log('Multiple opens - total:', analytics?.opened_count, 'unique:', analytics?.unique_opened_count);
    
    // Total opens should be more than unique opens
    expect(analytics?.opened_count).toBeGreaterThanOrEqual(analytics?.unique_opened_count || 0);
  });
});

test.describe('Analytics Aggregation Functions', () => {
  test('should correctly aggregate analytics when manually refreshed', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Get a recent campaign
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!campaigns || campaigns.length === 0) {
      test.skip();
      return;
    }
    
    const campaignId = campaigns[0].id;
    
    // Manually refresh analytics
    const { data: refreshResult, error: refreshError } = await supabase
      .rpc('refresh_campaign_analytics_simple', { p_campaign_id: campaignId });
    
    console.log('Refresh result:', refreshResult);
    console.log('Refresh error:', refreshError);
    
    expect(refreshError).toBeNull();
    expect(refreshResult).toBeDefined();
    
    // Check the analytics were updated
    const { data: analytics } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();
    
    expect(analytics).toBeDefined();
    expect(analytics?.updated_at).toBeDefined();
  });
});