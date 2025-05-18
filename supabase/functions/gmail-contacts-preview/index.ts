import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
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
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId, filters } = await req.json();
    const filterOptions: FilterOptions = filters || {
      onlyWithName: true,
      excludeNoReply: true,
      lastContactedDays: 180,
      searchTerm: ""
    };
    
    // If userId is not provided, try to get it from the authenticated user
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      // Try to get user ID from the supabase authorization header
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        try {
          // Create another client with the user's token
          const userSupabase = createClient(supabaseUrl, authHeader.replace('Bearer ', ''));
          const { data: { user }, error: userError } = await userSupabase.auth.getUser();
          if (!userError && user) {
            effectiveUserId = user.id;
          }
        } catch (e) {
          console.error('Failed to get user from auth header:', e);
        }
      }
    }
    
    if (!effectiveUserId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Processing contacts preview for user ${effectiveUserId} with filters:`, filterOptions);
    
    // 1. Get the user's Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', effectiveUserId)
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
      
      console.log(`Fetching contacts from Google API: ${peopleUrl}`);
      console.log(`Using access token: ${accessToken.substring(0, 5)}...${accessToken.substring(accessToken.length - 5)}`);
      
      // Send request to Google
      const response = await fetch(peopleUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      console.log(`Google API response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Google API error response:", error);
        throw new Error(`Failed to fetch contacts: ${error.error?.message || response.statusText}`);
      }
      
      // Parse response data
      const contactsData = await response.json();
      
      console.log(`Google API returned ${contactsData.connections ? contactsData.connections.length : 0} contacts`);
      console.log("Google API response sample:", JSON.stringify(contactsData).slice(0, 500) + "...");
      
      if (!contactsData.connections || contactsData.connections.length === 0) {
        console.log("No connections found in Google response, payload:", JSON.stringify(contactsData).slice(0, 500) + "...");
        return new Response(
          JSON.stringify({ 
            contacts: [],
            message: "No contacts found in your Google account"
          }),
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
        .eq('user_id', effectiveUserId);
        
      const existingEmails = new Set(existingContacts?.map(c => c.email.toLowerCase()) || []);
      console.log(`Found ${existingEmails.size} existing contacts to filter out`);
      
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
        if (email && typeof email === 'string' && email.includes('@')) {
          try {
            domain = email.split('@')[1];
          } catch (error) {
            console.error(`Error extracting domain from email ${email}:`, error);
          }
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
      
      console.log(`Mapped ${processedContacts.length} contacts from Google data`);
      console.log("Sample processed contact:", JSON.stringify(processedContacts[0]));
      
      // Filter out contacts without emails - disabled to show all contacts
      const beforeEmailFilter = processedContacts.length;
      // We don't filter out contacts without email anymore
      // processedContacts = processedContacts.filter(contact => !!contact.email);
      console.log(`After email filter: ${processedContacts.length} contacts (removed ${beforeEmailFilter - processedContacts.length} without emails)`);
      
      // Exclude contacts that are already in the CRM (based on email)
      if (existingEmails.size > 0) {
        console.log(`Filtering out ${existingEmails.size} existing contacts`);
        const beforeFilter = processedContacts.length;
        processedContacts = processedContacts.filter(contact => 
          !contact.email || !existingEmails.has(contact.email.toLowerCase())
        );
        console.log(`After filtering: ${processedContacts.length} contacts (removed ${beforeFilter - processedContacts.length})`);
      }
      
      // Apply filters for no-reply addresses if requested
      if (filterOptions.excludeNoReply) {
        const beforeFilter = processedContacts.length;
        processedContacts = processedContacts.filter(contact => {
          // Skip contacts without emails
          if (!contact.email) return true;
          
          const email = contact.email.toLowerCase();
          return !(
            email.startsWith('noreply@') || 
            email.startsWith('no-reply@') || 
            email.includes('.noreply@') || 
            email.includes('.no-reply@') ||
            email.includes('donotreply')
          );
        });
        console.log(`After no-reply filter: ${processedContacts.length} contacts (removed ${beforeFilter - processedContacts.length})`);
      }
      
      // If we're filtering to only include contacts with names
      if (filterOptions.onlyWithName) {
        const beforeFilter = processedContacts.length;
        processedContacts = processedContacts.filter(contact => 
          (contact.first_name && contact.first_name.trim() !== '') || 
          (contact.last_name && contact.last_name.trim() !== '')
        );
        console.log(`After name filter: ${processedContacts.length} contacts (removed ${beforeFilter - processedContacts.length} without names)`);
      }
      
      // If we're filtering by contacts contacted in the last X days, exclude others
      // This isn't implemented in this preview version
      
      // Apply search term filter if provided
      if (filterOptions.searchTerm) {
        const term = filterOptions.searchTerm.toLowerCase();
        const beforeFilter = processedContacts.length;
        processedContacts = processedContacts.filter(contact => {
          return (
            (contact.first_name && contact.first_name.toLowerCase().includes(term)) ||
            (contact.last_name && contact.last_name.toLowerCase().includes(term)) ||
            (contact.email && contact.email.toLowerCase().includes(term)) ||
            (contact.company && contact.company.toLowerCase().includes(term))
          );
        });
        console.log(`After search term filter: ${processedContacts.length} contacts (removed ${beforeFilter - processedContacts.length})`);
      }
      
      // Return processed contacts
      console.log(`Returning ${processedContacts.length} contacts after all filtering`);
      return new Response(
        JSON.stringify({
          contacts: processedContacts,
          total: processedContacts.length,
          existing: existingEmails.size
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (error) {
      console.error("Error fetching contacts:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Error fetching contacts" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Error in contacts preview:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 