import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bujaaqjxrvntcneoarkj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const campaignId = 'bd698e0f-25e1-46b9-afd0-453598228b80';

async function debugTrackingPixel() {
  console.log('🔍 Debugging Tracking Pixel for Campaign:', campaignId);
  console.log('='*60 + '\n');
  
  // 1. Get tracking record
  console.log('1. Finding tracking record:');
  const { data: tracking, error: trackingError } = await supabase
    .from('email_tracking')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (trackingError || !tracking || tracking.length === 0) {
    console.log('   ❌ No tracking record found');
    return;
  }
  
  const trackingRecord = tracking[0];
  console.log('   ✅ Found tracking record:');
  console.log('   - ID:', trackingRecord.id);
  console.log('   - Tracking Pixel ID:', trackingRecord.tracking_pixel_id);
  console.log('   - Email:', trackingRecord.recipient);
  console.log('   - Sent:', trackingRecord.sent_at ? new Date(trackingRecord.sent_at).toLocaleString() : 'Not recorded');
  console.log('   - Opened:', trackingRecord.opened_at ? new Date(trackingRecord.opened_at).toLocaleString() : 'Not opened');
  console.log('   - Open Count:', trackingRecord.open_count);
  
  if (!trackingRecord.tracking_pixel_id) {
    console.log('   ❌ No tracking pixel ID in record!');
    return;
  }
  
  // 2. Get current analytics
  console.log('\n2. Current analytics state:');
  const { data: analyticsBefore, error: analyticsError } = await supabase
    .from('campaign_analytics')
    .select('*')
    .eq('campaign_id', campaignId)
    .single();
    
  if (analyticsError) {
    console.log('   ❌ Error fetching analytics:', analyticsError);
  } else {
    console.log('   Sent:', analyticsBefore.sent_count);
    console.log('   Opened:', analyticsBefore.opened_count);
    console.log('   Unique Opened:', analyticsBefore.unique_opened_count);
  }
  
  // 3. Test the tracking pixel
  console.log('\n3. Testing tracking pixel:');
  const pixelUrl = `${supabaseUrl}/functions/v1/email-tracker?id=${trackingRecord.tracking_pixel_id}`;
  console.log('   URL:', pixelUrl);
  
  try {
    const response = await fetch(pixelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Test Debugger) Email Client'
      }
    });
    
    console.log('   Response Status:', response.status);
    console.log('   Response Headers:');
    console.log('   - Content-Type:', response.headers.get('content-type'));
    console.log('   - Content-Length:', response.headers.get('content-length'));
    
    if (response.status === 200) {
      console.log('   ✅ Tracking pixel returned successfully');
    } else {
      console.log('   ❌ Unexpected status code');
      const text = await response.text();
      console.log('   Response body:', text);
    }
  } catch (error) {
    console.log('   ❌ Error calling tracking pixel:', error);
  }
  
  // 4. Wait and check if analytics updated
  console.log('\n4. Waiting 3 seconds for analytics to update...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check tracking record again
  const { data: trackingAfter } = await supabase
    .from('email_tracking')
    .select('open_count, opened_at, last_opened_at')
    .eq('id', trackingRecord.id)
    .single();
    
  if (trackingAfter) {
    console.log('\n5. Tracking record after pixel call:');
    console.log('   Open Count:', trackingAfter.open_count);
    console.log('   Opened At:', trackingAfter.opened_at ? new Date(trackingAfter.opened_at).toLocaleString() : 'Not set');
    console.log('   Last Opened:', trackingAfter.last_opened_at ? new Date(trackingAfter.last_opened_at).toLocaleString() : 'Not set');
    
    if (trackingAfter.open_count > (trackingRecord.open_count || 0)) {
      console.log('   ✅ Open count increased!');
    } else {
      console.log('   ❌ Open count did not increase');
    }
  }
  
  // Check analytics again
  const { data: analyticsAfter } = await supabase
    .from('campaign_analytics')
    .select('opened_count, unique_opened_count, last_event_at, updated_at')
    .eq('campaign_id', campaignId)
    .single();
    
  if (analyticsAfter) {
    console.log('\n6. Analytics after pixel call:');
    console.log('   Opened:', analyticsAfter.opened_count);
    console.log('   Unique Opened:', analyticsAfter.unique_opened_count);
    console.log('   Last Event:', analyticsAfter.last_event_at ? new Date(analyticsAfter.last_event_at).toLocaleString() : 'None');
    console.log('   Updated:', new Date(analyticsAfter.updated_at).toLocaleString());
    
    if (analyticsAfter.opened_count > analyticsBefore.opened_count) {
      console.log('   ✅ Analytics opened count increased!');
    } else {
      console.log('   ❌ Analytics opened count did not increase');
    }
  }
  
  // Check for email events
  console.log('\n7. Checking for email events:');
  const { data: events } = await supabase
    .from('email_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('event_type', 'opened')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (events && events.length > 0) {
    console.log('   Found', events.length, 'open events');
    events.forEach(e => {
      console.log(`   - ${new Date(e.created_at).toLocaleString()}`);
    });
  } else {
    console.log('   ❌ No open events found');
  }
  
  console.log('\n✅ Debug complete!');
  console.log('\nPossible issues:');
  console.log('- Edge function may not have SERVICE_ROLE_KEY configured');
  console.log('- RLS policies may be blocking updates');
  console.log('- The tracking pixel ID might not match');
  console.log('- Check edge function logs: npx supabase functions logs email-tracker --project-ref bujaaqjxrvntcneoarkj');
}

debugTrackingPixel();