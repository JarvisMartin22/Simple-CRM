import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bujaaqjxrvntcneoarkj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTrackingSchema() {
  console.log('🔍 Checking Email Tracking Schema\n');
  
  // Get a sample record to see all columns
  const { data: sample, error } = await supabase
    .from('email_tracking')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('❌ Error fetching sample:', error);
  } else if (sample && sample.length > 0) {
    console.log('Sample record columns:');
    Object.entries(sample[0]).forEach(([key, value]) => {
      console.log(`- ${key}: ${typeof value} (${value === null ? 'null' : value === undefined ? 'undefined' : 'has value'})`);
    });
  }
  
  // Check if we can manually update open_count
  console.log('\n\nTesting manual update of open_count:');
  const trackingId = '03ddfce1-6ded-4f53-8cea-e53f65149247';
  
  const { data: updateData, error: updateError } = await supabase
    .from('email_tracking')
    .update({ 
      open_count: 1,
      opened_at: new Date().toISOString()
    })
    .eq('tracking_pixel_id', trackingId)
    .select();
    
  if (updateError) {
    console.log('❌ Update failed:', updateError);
    console.log('Error code:', updateError.code);
    console.log('Error hint:', updateError.hint);
  } else {
    console.log('✅ Update successful:', updateData);
  }
}

checkTrackingSchema();