import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to fetch main contacts
const fetchMainContacts = async (accessToken: string) => {
  try {
    console.log("Fetching main contacts...");
    const contactsUrl = 'https://people.googleapis.com/v1/people/me/connections?pageSize=1000&personFields=names,emailAddresses,phoneNumbers,organizations,urls,metadata,photos';
    
    const response = await fetch(contactsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching main contacts: ${response.status}`, error);
      return { success: false, data: null, error };
    }
    
    const data = await response.json();
    return { 
      success: true, 
      data: data.connections || [],
      totalItems: data.connections?.length || 0,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error("Error fetching main contacts:", error);
    return { success: false, data: null, error: error.message };
  }
};

// Function to fetch other contacts
const fetchOtherContacts = async (accessToken: string) => {
  try {
    console.log("Fetching other contacts...");
    const otherContactsUrl = 'https://people.googleapis.com/v1/otherContacts?pageSize=1000&readMask=names,emailAddresses,phoneNumbers,organizations,urls,metadata,photos';
    
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
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gmail-Token',
      }
    });
  }

  try {
    // Get the Gmail token from the header
    const gmailToken = req.headers.get('X-Gmail-Token');
    if (!gmailToken) {
      throw new Error('No Gmail token provided');
    }

    // Get the request body
    const { integration_id, access_token, refresh_token } = await req.json();

    if (!integration_id) {
      throw new Error('No integration ID provided');
    }

    if (!access_token) {
      throw new Error('No access token provided');
    }

    let allContacts = [];

    // Fetch main contacts
    const mainContactsResult = await fetchMainContacts(access_token);
    if (mainContactsResult.success) {
      allContacts = [...allContacts, ...mainContactsResult.data];
    } else {
      console.error('Failed to fetch main contacts:', mainContactsResult.error);
    }

    // Fetch other contacts
    const otherContactsResult = await fetchOtherContacts(access_token);
    if (otherContactsResult.success) {
      allContacts = [...allContacts, ...otherContactsResult.data];
    } else {
      console.error('Failed to fetch other contacts:', otherContactsResult.error);
    }

    if (allContacts.length === 0) {
      return new Response(JSON.stringify({
        contacts: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Process the contacts
    const processedContacts = allContacts.map((contact: any) => {
      const primaryName = contact.names ? contact.names.find((n: any) => n.metadata?.primary) || contact.names[0] : null;
      const primaryEmail = contact.emailAddresses ? contact.emailAddresses.find((e: any) => e.metadata?.primary) || contact.emailAddresses[0] : null;
      const primaryOrg = contact.organizations ? contact.organizations.find((o: any) => o.metadata?.primary) || contact.organizations[0] : null;
      const primaryPhone = contact.phoneNumbers ? contact.phoneNumbers.find((p: any) => p.metadata?.primary) || contact.phoneNumbers[0] : null;
      const primaryUrl = contact.urls ? contact.urls.find((u: any) => u.metadata?.primary) || contact.urls[0] : null;
      
      return {
        firstName: primaryName?.givenName || '',
        lastName: primaryName?.familyName || '',
        email: primaryEmail?.value || '',
        phone: primaryPhone?.value || '',
        title: primaryOrg?.title || '',
        company: primaryOrg?.name || '',
        website: primaryUrl?.value || '',
        names: contact.names || [],
        emailAddresses: contact.emailAddresses || [],
        phoneNumbers: contact.phoneNumbers || [],
        organizations: contact.organizations || [],
        urls: contact.urls || []
      };
    });

    // Return the processed contacts
    return new Response(JSON.stringify({
      contacts: processedContacts
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gmail-Token'
      },
      status: 200,
    });

  } catch (error) {
    console.error('Error in request:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gmail-Token'
      },
      status: 400,
    });
  }
}); 