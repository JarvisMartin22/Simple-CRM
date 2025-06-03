import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugTrackingSystem() {
  console.log('🔍 Comprehensive Tracking System Debug');
  console.log('=====================================\n');

  try {
    // Step 1: Check for any existing campaigns and events
    console.log('1. Checking existing campaigns and events...');
    
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return;
    }
    
    console.log(`Found ${campaigns?.length || 0} campaigns`);
    
    if (campaigns && campaigns.length > 0) {
      const campaign = campaigns[0];
      console.log(`\nUsing campaign: ${campaign.name} (${campaign.id})`);
      
      // Check email_events for this campaign
      const { data: events, error: eventsError } = await supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!eventsError && events) {
        console.log(`\nEmail events for this campaign:`);
        const eventTypes = {};
        events.forEach(e => {
          eventTypes[e.event_type] = (eventTypes[e.event_type] || 0) + 1;
        });
        Object.entries(eventTypes).forEach(([type, count]) => {
          console.log(`  - ${type}: ${count}`);
        });
        
        // Find a sent event with tracking_id
        const sentEvent = events.find(e => e.event_type === 'sent' && e.tracking_id);
        if (sentEvent) {
          console.log(`\nFound sent event with tracking_id: ${sentEvent.tracking_id}`);
          return { campaign, sentEvent };
        }
      }
    }
    
    // Step 2: Create a test campaign and email event
    console.log('\n2. Creating test campaign and email event...');
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('No authenticated user found. Please log in first.');
      return;
    }
    
    // Create test campaign
    const testCampaignName = `Debug Test ${new Date().toISOString()}`;
    const { data: newCampaign, error: newCampaignError } = await supabase
      .from('campaigns')
      .insert({
        name: testCampaignName,
        description: 'Test campaign for debugging tracking',
        status: 'sent',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (newCampaignError) {
      console.error('Error creating test campaign:', newCampaignError);
      return;
    }
    
    console.log(`Created test campaign: ${newCampaign.name} (${newCampaign.id})`);
    
    // Create test sent event
    const trackingId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const testEmail = 'test@example.com';
    
    const { data: sentEvent, error: sentEventError } = await supabase
      .from('email_events')
      .insert({
        campaign_id: newCampaign.id,
        event_type: 'sent',
        tracking_id: trackingId,
        recipient_email: testEmail,
        event_data: {
          subject: 'Test Email',
          sent_via: 'debug_script'
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (sentEventError) {
      console.error('Error creating sent event:', sentEventError);
      return;
    }
    
    console.log(`Created sent event with tracking_id: ${trackingId}`);
    
    // Initialize campaign analytics
    const { error: analyticsError } = await supabase
      .from('campaign_analytics')
      .insert({
        campaign_id: newCampaign.id,
        total_recipients: 1,
        sent_count: 1,
        delivered_count: 0,
        opened_count: 0,
        unique_opened_count: 0,
        clicked_count: 0,
        unique_clicked_count: 0,
        bounced_count: 0,
        complained_count: 0,
        unsubscribed_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (analyticsError && analyticsError.code !== '23505') { // Ignore duplicate key error
      console.error('Error initializing analytics:', analyticsError);
    }
    
    return { campaign: newCampaign, sentEvent: { ...sentEvent, tracking_id: trackingId } };
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function testTrackingEndpoints(campaignData) {
  if (!campaignData) return;
  
  const { campaign, sentEvent } = campaignData;
  const baseUrl = process.env.VITE_SUPABASE_URL;
  
  console.log('\n\n3. Testing Tracking Endpoints');
  console.log('==============================');
  
  // Test 1: Email Open Tracking
  console.log('\n📧 Testing email open tracking...');
  const openPixelUrl = `${baseUrl}/functions/v1/email-tracker?id=${sentEvent.tracking_id}&type=open&campaign=${campaign.id}`;
  console.log(`Pixel URL: ${openPixelUrl}`);
  
  try {
    const openResponse = await fetch(openPixelUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Test Browser) AppleWebKit/537.36'
      }
    });
    
    console.log(`Response status: ${openResponse.status}`);
    console.log(`Content-Type: ${openResponse.headers.get('content-type')}`);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if open event was created
    const { data: openEvents, error: openError } = await supabase
      .from('email_events')
      .select('*')
      .eq('tracking_id', sentEvent.tracking_id)
      .eq('event_type', 'opened')
      .order('created_at', { ascending: false });
    
    if (openError) {
      console.error('Error checking open events:', openError);
    } else {
      console.log(`✅ Open events created: ${openEvents?.length || 0}`);
      if (openEvents && openEvents.length > 0) {
        console.log(`   First open at: ${openEvents[0].created_at}`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing open tracking:', error);
  }
  
  // Test 2: Reopen Tracking
  console.log('\n🔄 Testing email reopen tracking...');
  const reopenPixelUrl = `${baseUrl}/functions/v1/email-tracker?id=${sentEvent.tracking_id}&type=reopen&campaign=${campaign.id}`;
  
  try {
    const reopenResponse = await fetch(reopenPixelUrl);
    console.log(`Reopen response status: ${reopenResponse.status}`);
    
    // Wait and check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: allOpenEvents } = await supabase
      .from('email_events')
      .select('*')
      .eq('tracking_id', sentEvent.tracking_id)
      .eq('event_type', 'opened');
    
    console.log(`✅ Total open events: ${allOpenEvents?.length || 0}`);
  } catch (error) {
    console.error('❌ Error testing reopen tracking:', error);
  }
  
  // Test 3: Link Click Tracking
  console.log('\n🔗 Testing link click tracking...');
  const testUrl = 'https://example.com/test-link';
  const clickUrl = `${baseUrl}/functions/v1/link-tracker?id=${sentEvent.tracking_id}&url=${encodeURIComponent(testUrl)}`;
  console.log(`Click URL: ${clickUrl}`);
  
  try {
    const clickResponse = await fetch(clickUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Test Browser) AppleWebKit/537.36'
      }
    });
    
    console.log(`Response status: ${clickResponse.status}`);
    console.log(`Location header: ${clickResponse.headers.get('location')}`);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if click event was created
    const { data: clickEvents, error: clickError } = await supabase
      .from('email_events')
      .select('*')
      .eq('tracking_id', sentEvent.tracking_id)
      .eq('event_type', 'clicked');
    
    if (clickError) {
      console.error('Error checking click events:', clickError);
    } else {
      console.log(`✅ Click events created: ${clickEvents?.length || 0}`);
      if (clickEvents && clickEvents.length > 0) {
        console.log(`   Link URL: ${clickEvents[0].link_url}`);
      }
    }
  } catch (error) {
    console.error('❌ Error testing click tracking:', error);
  }
  
  // Test 4: Check Campaign Analytics
  console.log('\n📊 Checking campaign analytics...');
  
  // First refresh analytics
  const { error: refreshError } = await supabase
    .rpc('refresh_campaign_analytics_simple', { p_campaign_id: campaign.id });
  
  if (refreshError) {
    console.error('Error refreshing analytics:', refreshError);
  }
  
  // Get analytics
  const { data: analytics, error: analyticsError } = await supabase
    .from('campaign_analytics')
    .select('*')
    .eq('campaign_id', campaign.id)
    .single();
  
  if (analyticsError) {
    console.error('Error fetching analytics:', analyticsError);
  } else if (analytics) {
    console.log('\nCampaign Analytics:');
    console.log(`  - Sent: ${analytics.sent_count}`);
    console.log(`  - Opened: ${analytics.opened_count} (Unique: ${analytics.unique_opened_count})`);
    console.log(`  - Clicked: ${analytics.clicked_count} (Unique: ${analytics.unique_clicked_count})`);
    console.log(`  - Last updated: ${analytics.updated_at}`);
  }
  
  // Test 5: Check RLS Policies
  console.log('\n🔒 Checking RLS policies...');
  
  // Try to insert an event directly (should work with service role)
  const testEventData = {
    campaign_id: campaign.id,
    event_type: 'test_direct',
    tracking_id: sentEvent.tracking_id,
    recipient_email: 'test@example.com',
    event_data: { test: true },
    created_at: new Date().toISOString()
  };
  
  const { error: directInsertError } = await supabase
    .from('email_events')
    .insert(testEventData);
  
  if (directInsertError) {
    console.error('❌ Direct insert failed:', directInsertError);
    console.log('   This might indicate RLS policy issues');
  } else {
    console.log('✅ Direct insert successful - RLS policies allow writes');
  }
}

// Run the debug process
async function runDebug() {
  const campaignData = await debugTrackingSystem();
  await testTrackingEndpoints(campaignData);
  
  console.log('\n\n📋 Debug Summary');
  console.log('================');
  console.log('1. Check Supabase Dashboard > Functions > Logs for edge function errors');
  console.log('2. Verify environment variables are set in edge functions');
  console.log('3. Check if tracking pixels are being blocked by email clients');
  console.log('4. For forwarding detection, we need to analyze email headers');
}

runDebug();