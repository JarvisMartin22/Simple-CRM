import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignAnalyticsUpdate {
  campaign_id: string;
  total_recipients?: number;
  sent_count?: number;
  delivered_count?: number;
  opened_count?: number;
  unique_opened_count?: number;
  clicked_count?: number;
  unique_clicked_count?: number;
  bounced_count?: number;
  complained_count?: number;
  unsubscribed_count?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { campaign_id } = await req.json()

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: 'campaign_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Refreshing analytics for campaign: ${campaign_id}`)

    // Get current campaign data
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('id, name, status, stats')
      .eq('id', campaign_id)
      .single()

    if (campaignError) {
      throw new Error(`Failed to fetch campaign: ${campaignError.message}`)
    }

    // Fetch email events for this campaign
    const { data: events, error: eventsError } = await supabaseClient
      .from('email_events')
      .select('*')
      .eq('campaign_id', campaign_id)

    if (eventsError) {
      console.warn(`Failed to fetch events: ${eventsError.message}`)
    }

    // Calculate analytics from events
    const analytics: CampaignAnalyticsUpdate = {
      campaign_id,
      total_recipients: campaign.stats?.total_recipients || 0,
      sent_count: 0,
      delivered_count: 0,
      opened_count: 0,
      unique_opened_count: 0,
      clicked_count: 0,
      unique_clicked_count: 0,
      bounced_count: 0,
      complained_count: 0,
      unsubscribed_count: 0,
    }

    if (events && events.length > 0) {
      const uniqueOpens = new Set<string>()
      const uniqueClicks = new Set<string>()

      events.forEach((event) => {
        switch (event.event_type) {
          case 'sent':
            analytics.sent_count!++
            break
          case 'delivered':
            analytics.delivered_count!++
            break
          case 'opened':
            analytics.opened_count!++
            if (event.recipient_id) {
              uniqueOpens.add(event.recipient_id)
            }
            break
          case 'clicked':
            analytics.clicked_count!++
            if (event.recipient_id) {
              uniqueClicks.add(event.recipient_id)
            }
            break
          case 'bounced':
            analytics.bounced_count!++
            break
          case 'complained':
            analytics.complained_count!++
            break
          case 'unsubscribed':
            analytics.unsubscribed_count!++
            break
        }
      })

      analytics.unique_opened_count = uniqueOpens.size
      analytics.unique_clicked_count = uniqueClicks.size
    }

    // Update or insert campaign analytics
    const { data: existingAnalytics } = await supabaseClient
      .from('campaign_analytics')
      .select('id')
      .eq('campaign_id', campaign_id)
      .single()

    let result
    if (existingAnalytics) {
      // Update existing record
      result = await supabaseClient
        .from('campaign_analytics')
        .update({
          ...analytics,
          last_event_at: events && events.length > 0 
            ? new Date(Math.max(...events.map(e => new Date(e.created_at).getTime()))).toISOString()
            : null,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaign_id)
        .select()
        .single()
    } else {
      // Insert new record
      result = await supabaseClient
        .from('campaign_analytics')
        .insert({
          ...analytics,
          last_event_at: events && events.length > 0 
            ? new Date(Math.max(...events.map(e => new Date(e.created_at).getTime()))).toISOString()
            : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      throw new Error(`Failed to update analytics: ${result.error.message}`)
    }

    console.log(`Analytics refreshed successfully for campaign: ${campaign_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id,
        analytics: result.data,
        events_processed: events?.length || 0,
        message: 'Analytics refreshed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error refreshing analytics:', error)

    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to refresh campaign analytics'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 