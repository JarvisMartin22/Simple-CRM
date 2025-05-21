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
  categories?: string[];
  resourceName?: string;
}

// Function to fetch other contacts
const fetchOtherContacts = async (accessToken: string) => {
  try {
    console.log("Fetching other contacts...");
    const otherContactsUrl = 'https://people.googleapis.com/v1/otherContacts?pageSize=1000&readMask=names,emailAddresses,phoneNumbers,metadata,photos';
    
    const response = await fetch(otherContactsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching other contacts: ${response.status}`, error);
      return { success: false, data: null, error };
    }
    
    const data = await response.json();
    return { 
      success: true, 
      data: data.otherContacts || [],
      totalItems: data.otherContacts?.length || 0,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error("Error fetching other contacts:", error);
    return { success: false, data: null, error: error.message };
  }
};

// Main handler for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { accessToken, resourceName } = await req.json();

    if (!accessToken) {
      throw new Error('No access token provided');
    }

    if (!resourceName) {
      throw new Error('No resource name provided');
    }

    let connections = [];

    // Fetch contacts based on the resource name
    if (resourceName === "connections") {
      const result = await fetchMainContacts(accessToken);
      if (!result.success) {
        throw new Error(`Failed to fetch main contacts: ${result.error}`);
      }
      connections = result.data;
      console.log(`Google API returned ${connections.length} main contacts`);
    } else if (resourceName === "otherContacts") {
      const result = await fetchOtherContacts(accessToken);
      if (!result.success) {
        throw new Error(`Failed to fetch other contacts: ${result.error}`);
      }
      connections = result.data;
      console.log(`Google API returned ${connections.length} other contacts`);
    }

    // Process the contacts
    let processedContacts = connections.map((contact: any) => {
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
        // Explicitly include the category
        category: resourceName === "connections" ? "contacts" : "otherContacts"
      };
    });

    // Return the processed contacts
    return new Response(JSON.stringify({
      contacts: processedContacts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in request:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
}); 