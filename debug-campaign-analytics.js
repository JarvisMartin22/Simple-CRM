import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugCampaignAnalytics() {
  console.log('🔍 Campaign Analytics Debug Tool');
  console.log('================================\n');

  try {
    // Step 1: Get a recent campaign
    console.log('1. Fetching recent campaigns...');
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError);
      return;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No campaigns found.');
      return;
    }

    console.log(`Found ${campaigns.length} campaigns:`);
    campaigns.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.id}) - Status: ${c.status}`);
    });

    // Pick the most recent campaign
    const campaign = campaigns[0];
    console.log(`\n📧 Analyzing campaign: ${campaign.name} (${campaign.id})`);

    // Step 2: Check email_events
    console.log('\n2. Checking email_events table...');
    const { data: events, error: eventsError } = await supabase
      .from('email_events')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching email_events:', eventsError);
    } else {
      console.log(`Found ${events.length} email events:`);
      
      // Count by type
      const eventCounts = {};
      events.forEach(e => {
        eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
      });
      
      Object.entries(eventCounts).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });

      // Show sample events
      if (events.length > 0) {
        console.log('\nSample events:');
        events.slice(0, 3).forEach(e => {
          console.log(`  - ${e.event_type} at ${e.created_at} (tracking_id: ${e.tracking_id})`);
        });
      }
    }

    // Step 3: Check campaign_analytics
    console.log('\n3. Checking campaign_analytics table...');
    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaign.id)
      .single();

    if (analyticsError) {
      console.error('Error fetching campaign_analytics:', analyticsError);
      console.log('Analytics record might not exist.');
    } else if (analytics) {
      console.log('Campaign Analytics:');
      console.log(`  - Total Recipients: ${analytics.total_recipients}`);
      console.log(`  - Sent: ${analytics.sent_count}`);
      console.log(`  - Delivered: ${analytics.delivered_count}`);
      console.log(`  - Opened: ${analytics.opened_count} (Unique: ${analytics.unique_opened_count})`);
      console.log(`  - Clicked: ${analytics.clicked_count} (Unique: ${analytics.unique_clicked_count})`);
      console.log(`  - Bounced: ${analytics.bounced_count}`);
      console.log(`  - Last Updated: ${analytics.updated_at}`);
    }

    // Step 4: Check campaign_recipients
    console.log('\n4. Checking campaign_recipients table...');
    const { data: recipients, error: recipientsError } = await supabase
      .from('campaign_recipients')
      .select('*')
      .eq('campaign_id', campaign.id)
      .limit(10);

    if (recipientsError) {
      console.error('Error fetching campaign_recipients:', recipientsError);
    } else {
      console.log(`Found ${recipients.length} recipients (showing first 10):`);
      recipients.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.email} - Status: ${r.status}, Sent: ${r.sent_at ? '✓' : '✗'}, Opened: ${r.opened_at ? '✓' : '✗'}, Clicked: ${r.clicked_at ? '✓' : '✗'}`);
      });
    }

    // Step 5: Try manually refreshing analytics
    console.log('\n5. Manually refreshing campaign analytics...');
    const { data: refreshResult, error: refreshError } = await supabase
      .rpc('refresh_campaign_analytics_simple', { p_campaign_id: campaign.id });

    if (refreshError) {
      console.error('Error refreshing analytics:', refreshError);
    } else {
      console.log('Refresh result:', refreshResult);
    }

    // Step 6: Check analytics again after refresh
    console.log('\n6. Re-checking campaign_analytics after refresh...');
    const { data: updatedAnalytics, error: updatedError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaign.id)
      .single();

    if (!updatedError && updatedAnalytics) {
      console.log('Updated Analytics:');
      console.log(`  - Opened: ${updatedAnalytics.opened_count} (Unique: ${updatedAnalytics.unique_opened_count})`);
      console.log(`  - Clicked: ${updatedAnalytics.clicked_count} (Unique: ${updatedAnalytics.unique_clicked_count})`);
    }

    // Step 7: Check for tracking pixel requests
    console.log('\n7. Checking for recent tracking events (last 24 hours)...');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentOpens, error: recentError } = await supabase
      .from('email_events')
      .select('*')
      .eq('event_type', 'opened')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentError && recentOpens) {
      console.log(`Found ${recentOpens.length} recent open events:`);
      recentOpens.forEach(e => {
        console.log(`  - Campaign: ${e.campaign_id}, Time: ${e.created_at}`);
      });
    }

    // Step 8: Test tracking pixel URL generation
    console.log('\n8. Sample tracking pixel URL:');
    const sampleTrackingId = 'test-' + Math.random().toString(36).substring(7);
    const pixelUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/email-tracker?id=${sampleTrackingId}&type=open&campaign=${campaign.id}`;
    console.log(`  ${pixelUrl}`);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the debug tool
debugCampaignAnalytics();