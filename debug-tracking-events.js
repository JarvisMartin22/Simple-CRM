#!/usr/bin/env node

// Debug script to check email tracking events for a specific campaign
// This will help diagnose why clicks are being counted as opens

import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTrackingEvents(campaignId = '94e1db42-6586-47dd-b827-18d1d05f4364') {
  console.log('🔍 Debugging tracking events for campaign:', campaignId);
  console.log('==========================================');

  try {
    // 1. Check campaign analytics
    console.log('\n📊 Campaign Analytics:');
    const { data: analytics, error: analyticsError } = await supabase
      .from('campaign_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
    } else {
      console.log('Analytics:', {
        sent_count: analytics.sent_count,
        opened_count: analytics.opened_count,
        clicked_count: analytics.clicked_count,
        unique_opened_count: analytics.unique_opened_count,
        unique_clicked_count: analytics.unique_clicked_count
      });
    }

    // 2. Check email_events breakdown
    console.log('\n📧 Email Events Breakdown:');
    const { data: events, error: eventsError } = await supabase
      .from('email_events')
      .select('event_type, created_at, tracking_id, recipient_email, event_data')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });

    if (eventsError) {
      console.error('Events error:', eventsError);
    } else {
      console.log(`Total events: ${events.length}`);
      
      // Group by event type
      const eventCounts = events.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Event type counts:', eventCounts);
      
      // Show recent events
      console.log('\n📝 Recent Events (last 10):');
      events.slice(-10).forEach(event => {
        console.log(`  ${event.created_at} | ${event.event_type} | ${event.recipient_email} | ${event.tracking_id || 'no-tracking-id'}`);
      });
      
      // Check for duplicate tracking_ids
      const trackingIds = events.filter(e => e.tracking_id).map(e => e.tracking_id);
      const uniqueTrackingIds = [...new Set(trackingIds)];
      
      if (trackingIds.length !== uniqueTrackingIds.length) {
        console.log('\n⚠️  Duplicate tracking IDs found!');
        console.log(`Total tracking events: ${trackingIds.length}`);
        console.log(`Unique tracking IDs: ${uniqueTrackingIds.length}`);
        
        // Find duplicates
        const duplicates = trackingIds.filter((id, index) => trackingIds.indexOf(id) !== index);
        const uniqueDuplicates = [...new Set(duplicates)];
        
        console.log('Duplicate tracking IDs:', uniqueDuplicates);
        
        // Show events for first duplicate
        if (uniqueDuplicates.length > 0) {
          const duplicateEvents = events.filter(e => e.tracking_id === uniqueDuplicates[0]);
          console.log(`Events for tracking ID ${uniqueDuplicates[0]}:`);
          duplicateEvents.forEach(event => {
            console.log(`  ${event.created_at} | ${event.event_type} | ${event.recipient_email}`);
          });
        }
      }
    }

    // 3. Check if there are events without proper campaign_id
    console.log('\n🔍 Events without campaign_id:');
    const { data: orphanEvents, error: orphanError } = await supabase
      .from('email_events')
      .select('event_type, created_at, tracking_id, recipient_email')
      .is('campaign_id', null)
      .limit(5);

    if (orphanError) {
      console.error('Orphan events error:', orphanError);
    } else {
      console.log(`Orphan events found: ${orphanEvents.length}`);
      orphanEvents.forEach(event => {
        console.log(`  ${event.created_at} | ${event.event_type} | ${event.recipient_email} | ${event.tracking_id || 'no-tracking-id'}`);
      });
    }

  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Run the debug function
const campaignId = process.argv[2] || '94e1db42-6586-47dd-b827-18d1d05f4364';
debugTrackingEvents(campaignId).then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(err => {
  console.error('Debug failed:', err);
  process.exit(1);
});

export { debugTrackingEvents };