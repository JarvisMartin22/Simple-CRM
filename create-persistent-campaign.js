import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bujaaqjxrvntcneoarkj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU1NDA3NCwiZXhwIjoyMDYyMTMwMDc0fQ.2U2JEKnNLQPWlMOmUhSDpjzuU0QaJyBZHMYb6BpUDlE';

// Use service role key to bypass RLS for testing
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPersistentCampaign() {
  console.log('🚀 Creating Persistent Campaign for Testing');
  console.log('=' * 50);
  
  const userId = 'f0c496b2-81ad-4c96-a171-3c4c01058cee'; // Known user from tracking tests
  
  // First, clean up orphaned analytics
  console.log('1. Cleaning up orphaned analytics...');
  const { error: cleanupError } = await supabase
    .from('campaign_analytics')
    .delete()
    .not('campaign_id', 'in', '(SELECT id FROM campaigns)');
    
  if (cleanupError) {
    console.log('❌ Cleanup failed:', cleanupError);
  } else {
    console.log('✅ Orphaned analytics cleaned up');
  }
  
  // Create a test campaign that won't be deleted
  console.log('\n2. Creating persistent test campaign...');
  const testCampaign = {
    id: 'bd698e0f-25e1-46b9-afd0-453598228b80', // Use the same ID from previous tests
    user_id: userId,
    name: 'Persistent Test Campaign',
    type: 'one_time',
    status: 'draft',
    description: 'Test campaign for debugging - DO NOT DELETE',
    audience_filter: {
      contacts: [
        { id: 'test-contact-1', email: 'iwanaemailjarvis@gmail.com' }
      ],
      size: 1
    }
  };
  
  // Delete any existing campaign with this ID first
  const { error: deleteExistingError } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', testCampaign.id);
  
  console.log('Deleted existing campaign (if any)');
  
  const { data: campaignData, error: campaignError } = await supabase
    .from('campaigns')
    .insert([testCampaign])
    .select()
    .single();

  if (campaignError) {
    console.log('❌ Campaign creation failed:', campaignError);
    return;
  }

  console.log('✅ Campaign created:', campaignData.id);

  // Check if analytics were auto-created
  console.log('\n3. Checking analytics...');
  const { data: analyticsData, error: analyticsError } = await supabase
    .from('campaign_analytics')
    .select('*')
    .eq('campaign_id', campaignData.id)
    .single();

  if (analyticsError) {
    console.log('❌ No analytics found:', analyticsError.message);
    
    // Manually create analytics if trigger didn't work
    console.log('Creating analytics manually...');
    const { data: manualAnalytics, error: manualError } = await supabase
      .from('campaign_analytics')
      .insert([{
        campaign_id: campaignData.id,
        total_recipients: 1,
        sent_count: 0,
        delivered_count: 0,
        opened_count: 0,
        unique_opened_count: 0,
        clicked_count: 0,
        unique_clicked_count: 0,
        bounced_count: 0,
        complained_count: 0,
        unsubscribed_count: 0
      }])
      .select()
      .single();
      
    if (manualError) {
      console.log('❌ Manual analytics creation failed:', manualError);
    } else {
      console.log('✅ Analytics created manually');
    }
  } else {
    console.log('✅ Analytics auto-created:', {
      sent_count: analyticsData.sent_count,
      opened_count: analyticsData.opened_count
    });
  }
  
  // Check if there's a Gmail integration for this user
  console.log('\n4. Checking Gmail integration...');
  const { data: integration, error: integrationError } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .single();
    
  if (integrationError) {
    console.log('❌ No Gmail integration found');
    console.log('You need to connect Gmail in the app before testing email sending');
  } else {
    console.log('✅ Gmail integration found:', {
      email: integration.email,
      status: integration.status,
      created_at: integration.created_at
    });
  }

  console.log('\n✅ Setup complete!');
  console.log('\nYou can now test:');
  console.log('- Campaign exists with ID:', campaignData.id);
  console.log('- Tracking pixel should work');
  console.log('- Send-email function should work (if Gmail is connected)');
}

createPersistentCampaign().catch(console.error);