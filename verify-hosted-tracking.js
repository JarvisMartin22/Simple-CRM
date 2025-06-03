import { createClient } from '@supabase/supabase-js';

// Using hosted Supabase
const SUPABASE_URL = 'https://bujaaqjxrvntcneoarkj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyHostedTracking() {
  console.log('🔍 Verifying Hosted Supabase Tracking');
  console.log('=====================================\n');

  try {
    // Step 1: Get the campaign you mentioned
    const campaignId = '976793ec-fef9-4b5c-a855-3c657410cf31';
    console.log(`1. Checking campaign: ${campaignId}\n`);

    // Check email events
    const { data: events, error: eventsError } = await supabase
      .from('email_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return;
    }

    console.log(`Found ${events?.length || 0} email events:`);
    const eventTypes = {};
    events?.forEach(e => {
      eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1;
    });
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    // Get a tracking ID for testing
    const sentEvent = events?.find(e => e.event_type === 'sent' && e.tracking_id);
    if (!sentEvent) {
      console.log('\n❌ No sent events with tracking_id found');
      return;
    }

    const trackingId = sentEvent.tracking_id;
    console.log(`\n2. Testing with tracking_id: ${trackingId}`);

    // Test open tracking (without auth)
    console.log('\n3. Testing open tracking pixel (no auth)...');
    const openUrl = `${SUPABASE_URL}/functions/v1/email-tracker?id=${trackingId}&type=open&campaign=${campaignId}`;
    const openResponse = await fetch(openUrl);
    console.log(`   Status: ${openResponse.status} ${openResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`   Content-Type: ${openResponse.headers.get('content-type')}`);

    // Test click tracking (without auth)
    console.log('\n4. Testing click tracking (no auth)...');
    const testUrl = 'https://example.com/test';
    const clickUrl = `${SUPABASE_URL}/functions/v1/link-tracker?id=${trackingId}&url=${encodeURIComponent(testUrl)}`;
    const clickResponse = await fetch(clickUrl, { redirect: 'manual' });
    console.log(`   Status: ${clickResponse.status} ${clickResponse.status === 302 ? '✅' : '❌'}`);
    console.log(`   Redirect: ${clickResponse.headers.get('location')}`);

    // Wait for events to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for new events
    console.log('\n5. Checking for new tracking events...');
    const { data: newEvents } = await supabase
      .from('email_events')
      .select('*')
      .eq('tracking_id', trackingId)
      .in('event_type', ['opened', 'clicked'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (newEvents && newEvents.length > 0) {
      console.log(`Found ${newEvents.length} new tracking events:`);
      newEvents.forEach(e => {
        console.log(`  - ${e.event_type} at ${new Date(e.created_at).toLocaleTimeString()}`);
      });
    }

    // Check analytics
    console.log('\n6. Checking campaign analytics...');
    const { data: analytics } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (analytics) {
      console.log('Current Analytics:');
      console.log(`  - Sent: ${analytics.sent_count}`);
      console.log(`  - Opened: ${analytics.opened_count} (Unique: ${analytics.unique_opened_count})`);
      console.log(`  - Clicked: ${analytics.clicked_count} (Unique: ${analytics.unique_clicked_count})`);
      console.log(`  - Last updated: ${new Date(analytics.updated_at).toLocaleTimeString()}`);
    }

    // Try refreshing analytics
    console.log('\n7. Refreshing analytics...');
    const { data: refreshResult, error: refreshError } = await supabase
      .rpc('refresh_campaign_analytics_simple', { p_campaign_id: campaignId });

    if (refreshError) {
      console.error('Refresh error:', refreshError);
    } else {
      console.log('Refresh result:', refreshResult);
    }

    // Check analytics again
    const { data: updatedAnalytics } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (updatedAnalytics) {
      console.log('\nUpdated Analytics:');
      console.log(`  - Opened: ${updatedAnalytics.opened_count} (Unique: ${updatedAnalytics.unique_opened_count})`);
      console.log(`  - Clicked: ${updatedAnalytics.clicked_count} (Unique: ${updatedAnalytics.unique_clicked_count})`);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

verifyHostedTracking();