import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FilterOptions {
  onlyWithName: boolean;
  excludeNoReply: boolean;
  lastContactedDays: number | null;
  searchTerm: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, filters } = await req.json();
    const filterOptions: FilterOptions = filters || {
      onlyWithName: true,
      excludeNoReply: true,
      lastContactedDays: 180,
      searchTerm: ""
    };
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Processing contacts preview for user ${userId} with filters:`, filterOptions);
    
    // 1. Get the user's Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .single();
      
    if (integrationError) {
      console.error("Error fetching integration:", integrationError);
      return new Response(
        JSON.stringify({ error: "Gmail integration not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // 2. Check if token needs refreshing
    const now = new Date();
    const expiresAt = new Date(integration.expires_at);
    let accessToken = integration.access_token;
    
    if (expiresAt < now) {
      console.log("Token expired, refreshing...");
      try {
        // Refresh the token
        const response = await fetch(`${supabaseUrl}/functions/v1/gmail-auth`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ refresh_token: integration.refresh_token }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to refresh token: ${response.statusText}`);
        }
        
        const refreshData = await response.json();
        
        // Update token in database
        await supabase
          .from('user_integrations')
          .update({
            access_token: refreshData.access_token,
            expires_at: refreshData.expires_at,
          })
          .eq('id', integration.id);
          
        accessToken = refreshData.access_token;
        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Token refresh error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to refresh access token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }
    
    // 3. Fetch contacts from Gmail People API
    try {
      // Determine time filter (if any)
      let peopleUrl = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers,urls,metadata,photos&sortOrder=LAST_MODIFIED_DESCENDING';
      
      // Increase results per page to max (1000)
      peopleUrl += '&pageSize=1000';
      
      // Send request to Google
      const response = await fetch(peopleUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch contacts: ${error.error?.message || response.statusText}`);
      }
      
      // Parse response data
      const contactsData = await response.json();
      
      if (!contactsData.connections) {
        return new Response(
          JSON.stringify({ contacts: [] }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
      
      // 4. Fetch existing contacts to avoid duplicates
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('email')
        .eq('user_id', userId);
        
      const existingEmails = new Set(existingContacts?.map(c => c.email.toLowerCase()) || []);
      
      // 5. Process contacts with filtering
      let processedContacts = contactsData.connections.map((contact: any) => {
        const primaryName = contact.names ? contact.names.find((n: any) => n.metadata?.primary) || contact.names[0] : null;
        const primaryEmail = contact.emailAddresses ? contact.emailAddresses.find((e: any) => e.metadata?.primary) || contact.emailAddresses[0] : null;
        const primaryOrg = contact.organizations ? contact.organizations.find((o: any) => o.metadata?.primary) || contact.organizations[0] : null;
        const primaryPhone = contact.phoneNumbers ? contact.phoneNumbers.find((p: any) => p.metadata?.primary) || contact.phoneNumbers[0] : null;
        const primaryUrl = contact.urls ? contact.urls.find((u: any) => u.metadata?.primary) || contact.urls[0] : null;
        const photo = contact.photos ? contact.photos.find((p: any) => p.metadata?.primary)?.url : null;
        
        // Extract domain from email
        const email = primaryEmail?.value || null;
        let domain = null;
        if (email && email.includes('@')) {
          domain = email.split('@')[1];
        }
        
        const resourceId = contact.resourceName?.split('/')[1] || Math.random().toString(36).substring(2, 9);
        
        return {
          id: resourceId,
          first_name: primaryName?.givenName || '',
          last_name: primaryName?.familyName || '',
          email: email,
          domain: domain,
          company: primaryOrg?.name || null,
          title: primaryOrg?.title || null,
          phone: primaryPhone?.value || null,
          website: primaryUrl?.value || null,
          photo_url: photo,
          external_id: contact.resourceName,
        };
      });
      
      // Apply filters
      processedContacts = processedContacts.filter(contact => {
        // Must have an email
        if (!contact.email) return false;
        
        // Only contacts with names (first and/or last)
        if (filterOptions.onlyWithName && !contact.first_name && !contact.last_name) {
          return false;
        }
        
        // Exclude system/no-reply emails
        if (filterOptions.excludeNoReply) {
          const lowerEmail = contact.email.toLowerCase();
          const noReplyPatterns = [
            'noreply', 'no-reply', 'do-not-reply', 'donotreply',
            'notification', 'alert', 'info@', 'support@', 'help@',
            'system@', 'admin@', 'service@', 'contact@'
          ];
          
          if (noReplyPatterns.some(pattern => lowerEmail.includes(pattern))) {
            return false;
          }
        }
        
        // Already exists in database
        if (existingEmails.has(contact.email.toLowerCase())) {
          return false;
        }
        
        return true;
      });
      
      console.log(`Found ${processedContacts.length} contacts after filtering`);
      
      return new Response(
        JSON.stringify({ contacts: processedContacts }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (error) {
      console.error("Error fetching Gmail contacts:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("Gmail contacts preview error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}); 