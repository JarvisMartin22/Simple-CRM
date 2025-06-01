import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bujaaqjxrvntcneoarkj.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';

test.describe('Email Tracking and Campaign Analytics', () => {
  let supabase: any;
  let testCampaignId: string;
  let testUserId: string;
  let testContactId: string;

  test.beforeEach(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Using Supabase Key length:', supabaseAnonKey.length);
    
    // Skip auth for now and use a test user ID
    testUserId = 'test-user-' + Date.now();

    // Create test contact
    const { data: contact } = await supabase
      .from('contacts')
      .insert({
        user_id: testUserId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
      .select()
      .single();
    testContactId = contact.id;

    // Create test campaign
    const { data: campaign } = await supabase
      .from('campaigns')
      .insert({
        user_id: testUserId,
        name: 'Test Analytics Campaign',
        status: 'active',
        subject: 'Test Email',
        content: 'Test content with <img src="{{TRACKING_PIXEL}}" /> and <a href="{{TRACKING_LINK}}">link</a>'
      })
      .select()
      .single();
    testCampaignId = campaign.id;
  });

  test.afterEach(async () => {
    // Cleanup test data
    await supabase.from('email_events').delete().eq('campaign_id', testCampaignId);
    await supabase.from('campaign_analytics').delete().eq('campaign_id', testCampaignId);
    await supabase.from('email_tracking').delete().eq('campaign_id', testCampaignId);
    await supabase.from('campaigns').delete().eq('id', testCampaignId);
    await supabase.from('contacts').delete().eq('id', testContactId);
  });

  test('should track email opens and update campaign analytics', async ({ page }) => {
    // Create email tracking record
    const trackingPixelId = `test-pixel-${Date.now()}`;
    const { data: tracking } = await supabase
      .from('email_tracking')
      .insert({
        user_id: testUserId,
        campaign_id: testCampaignId,
        recipient: 'test@example.com',
        subject: 'Test Email',
        tracking_pixel_id: trackingPixelId,
        open_count: 0
      })
      .select()
      .single();

    // Simulate email open by calling tracking pixel
    const trackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${trackingPixelId}`;
    const response = await page.request.get(trackingUrl);
    expect(response.status()).toBe(200);

    // Wait for tracking to process
    await page.waitForTimeout(2000);

    // Check that email_tracking was updated
    const { data: updatedTracking } = await supabase
      .from('email_tracking')
      .select('open_count, opened_at')
      .eq('tracking_pixel_id', trackingPixelId)
      .single();
    
    expect(updatedTracking.open_count).toBe(1);
    expect(updatedTracking.opened_at).toBeTruthy();

    // Check that email_events was created
    const { data: events } = await supabase
      .from('email_events')
      .select('*')
      .eq('campaign_id', testCampaignId)
      .eq('event_type', 'opened');
    
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].event_type).toBe('opened');

    // Check that campaign_analytics was updated
    const { data: analytics } = await supabase
      .from('campaign_analytics')
      .select('opened_count, unique_opened_count')
      .eq('campaign_id', testCampaignId)
      .single();
    
    expect(analytics.opened_count).toBeGreaterThan(0);
  });

  test('should track link clicks and update analytics', async ({ page }) => {
    // Create email tracking record and tracked link
    const trackingPixelId = `test-pixel-${Date.now()}`;
    const linkTrackingId = `test-link-${Date.now()}`;
    
    const { data: tracking } = await supabase
      .from('email_tracking')
      .insert({
        user_id: testUserId,
        campaign_id: testCampaignId,
        recipient: 'test@example.com',
        subject: 'Test Email',
        tracking_pixel_id: trackingPixelId
      })
      .select()
      .single();

    const { data: trackedLink } = await supabase
      .from('tracked_links')
      .insert({
        email_tracking_id: tracking.id,
        campaign_id: testCampaignId,
        contact_id: testContactId,
        tracking_id: linkTrackingId,
        original_url: 'https://example.com',
        click_count: 0
      })
      .select()
      .single();

    // Simulate link click
    const linkUrl = `${supabaseUrl}/functions/v1/link-tracker?id=${linkTrackingId}&url=https://example.com`;
    const response = await page.request.get(linkUrl);
    expect(response.status()).toBe(302); // Should redirect

    // Wait for tracking to process
    await page.waitForTimeout(2000);

    // Check that tracked_links was updated
    const { data: updatedLink } = await supabase
      .from('tracked_links')
      .select('click_count, last_clicked_at')
      .eq('tracking_id', linkTrackingId)
      .single();
    
    expect(updatedLink.click_count).toBe(1);
    expect(updatedLink.last_clicked_at).toBeTruthy();

    // Check that email_events was created
    const { data: events } = await supabase
      .from('email_events')
      .select('*')
      .eq('campaign_id', testCampaignId)
      .eq('event_type', 'clicked');
    
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].event_type).toBe('clicked');

    // Check that campaign_analytics was updated
    const { data: analytics } = await supabase
      .from('campaign_analytics')
      .select('clicked_count')
      .eq('campaign_id', testCampaignId)
      .single();
    
    expect(analytics.clicked_count).toBeGreaterThan(0);
  });

  test('should display real-time analytics in dashboard', async ({ page }) => {
    // Setup tracking data first
    const trackingPixelId = `test-pixel-${Date.now()}`;
    await supabase
      .from('email_tracking')
      .insert({
        user_id: testUserId,
        campaign_id: testCampaignId,
        recipient: 'test@example.com',
        subject: 'Test Email',
        tracking_pixel_id: trackingPixelId,
        open_count: 1,
        opened_at: new Date().toISOString()
      });

    // Insert some email events
    await supabase
      .from('email_events')
      .insert([
        {
          campaign_id: testCampaignId,
          recipient_id: testContactId,
          event_type: 'opened',
          created_at: new Date().toISOString()
        },
        {
          campaign_id: testCampaignId,
          recipient_id: testContactId,
          event_type: 'clicked',
          link_url: 'https://example.com',
          created_at: new Date().toISOString()
        }
      ]);

    // Create campaign analytics
    await supabase
      .from('campaign_analytics')
      .insert({
        campaign_id: testCampaignId,
        opened_count: 1,
        clicked_count: 1,
        unique_opened_count: 1,
        unique_clicked_count: 1
      });

    // Navigate to campaign analytics page
    await page.goto(`http://localhost:5173/campaigns/${testCampaignId}`);
    
    // Wait for analytics to load
    await page.waitForSelector('[data-testid="campaign-analytics"]', { timeout: 10000 });

    // Check that metrics are displayed
    await expect(page.locator('text=Opens')).toBeVisible();
    await expect(page.locator('text=Clicks')).toBeVisible();
    
    // Look for actual numbers in metrics
    const opensMetric = page.locator('[data-testid="opens-count"]');
    const clicksMetric = page.locator('[data-testid="clicks-count"]');
    
    if (await opensMetric.count() > 0) {
      await expect(opensMetric).toContainText('1');
    }
    if (await clicksMetric.count() > 0) {
      await expect(clicksMetric).toContainText('1');
    }

    // Test refresh functionality
    await page.click('button:has-text("Refresh")');
    await page.waitForTimeout(2000);
    
    // Analytics should still be visible after refresh
    await expect(page.locator('text=Opens')).toBeVisible();
  });

  test('should handle multiple email opens correctly', async ({ page }) => {
    const trackingPixelId = `test-pixel-${Date.now()}`;
    
    // Create tracking record
    await supabase
      .from('email_tracking')
      .insert({
        user_id: testUserId,
        campaign_id: testCampaignId,
        recipient: 'test@example.com',
        subject: 'Test Email',
        tracking_pixel_id: trackingPixelId,
        open_count: 0
      });

    // Simulate multiple opens
    const trackingUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${trackingPixelId}`;
    
    for (let i = 0; i < 3; i++) {
      const response = await page.request.get(trackingUrl);
      expect(response.status()).toBe(200);
      await page.waitForTimeout(500);
    }

    // Wait for all tracking to process
    await page.waitForTimeout(3000);

    // Check that open count increased
    const { data: tracking } = await supabase
      .from('email_tracking')
      .select('open_count')
      .eq('tracking_pixel_id', trackingPixelId)
      .single();
    
    expect(tracking.open_count).toBe(3);

    // Check that multiple events were recorded
    const { data: events } = await supabase
      .from('email_events')
      .select('*')
      .eq('campaign_id', testCampaignId)
      .eq('event_type', 'opened');
    
    expect(events.length).toBe(3);
  });

  test('should refresh campaign analytics via edge function', async ({ page }) => {
    // Create some email events first
    await supabase
      .from('email_events')
      .insert([
        {
          campaign_id: testCampaignId,
          recipient_id: testContactId,
          event_type: 'opened',
          created_at: new Date().toISOString()
        },
        {
          campaign_id: testCampaignId,
          recipient_id: testContactId,
          event_type: 'clicked',
          created_at: new Date().toISOString()
        }
      ]);

    // Call refresh analytics function
    const refreshUrl = `${supabaseUrl}/functions/v1/refresh-campaign-analytics`;
    const response = await page.request.post(refreshUrl, {
      data: { campaign_id: testCampaignId },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);

    // Check that analytics were created/updated
    const { data: analytics } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', testCampaignId)
      .single();
    
    expect(analytics.opened_count).toBeGreaterThan(0);
    expect(analytics.clicked_count).toBeGreaterThan(0);
  });
});