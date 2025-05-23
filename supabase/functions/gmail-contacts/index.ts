import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Contact {
  names?: Array<{
    metadata?: { primary?: boolean };
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses?: Array<{
    metadata?: { primary?: boolean };
    value?: string;
  }>;
  organizations?: Array<{
    metadata?: { primary?: boolean };
    name?: string;
    title?: string;
  }>;
  phoneNumbers?: Array<{
    metadata?: { primary?: boolean };
    value?: string;
  }>;
  urls?: Array<{
    metadata?: { primary?: boolean };
    value?: string;
  }>;
  resourceName?: string;
  type?: 'main' | 'other';
}

// Function to fetch main contacts
const fetchMainContacts = async (accessToken: string): Promise<{ success: boolean; data: Contact[]; error?: string }> => {
  try {
    console.log("Fetching main contacts...");
    const contactsUrl = 'https://people.googleapis.com/v1/people/me/connections?pageSize=1000&personFields=names,emailAddresses,phoneNumbers,organizations,urls,metadata,photos';
    
    const response = await fetch(contactsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    console.log('Main contacts response status:', response.status);
    console.log('Main contacts response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching main contacts: ${response.status}`, error);
      return { success: false, data: [], error };
    }
    
    const data = await response.json();
    console.log(`Found ${data.connections?.length || 0} main contacts`);
    
    if (!data.connections || !Array.isArray(data.connections)) {
      console.error('Unexpected response format - connections is not an array:', 
        JSON.stringify(data).substring(0, 200) + '...');
      return { success: false, data: [], error: 'Invalid response format' };
    }
    
    return { 
      success: true, 
      data: data.connections || []
    };
  } catch (error) {
    console.error("Error fetching main contacts:", error);
    return { success: false, data: [], error: error.message };
  }
};

// Function to fetch other contacts
const fetchOtherContacts = async (accessToken: string): Promise<{ success: boolean; data: Contact[]; error?: string }> => {
  try {
    console.log("Fetching other contacts...");
    // Only include fields that are allowed for other contacts
    const otherContactsUrl = 'https://people.googleapis.com/v1/otherContacts?pageSize=1000&readMask=names,emailAddresses,phoneNumbers,metadata';
    
    console.log("Other contacts request URL:", otherContactsUrl);
    const response = await fetch(otherContactsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    console.log('Other contacts response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching other contacts: ${response.status}`, error);
      return { success: false, data: [], error };
    }
    
    const data = await response.json();
    console.log('Other contacts raw response:', JSON.stringify(data).substring(0, 500) + '...');
    console.log(`Found ${data.otherContacts?.length || 0} other contacts`);
    
    if (!data.otherContacts || !Array.isArray(data.otherContacts)) {
      console.error('Unexpected response format - otherContacts is not an array:', 
        JSON.stringify(data).substring(0, 200) + '...');
      return { success: false, data: [], error: 'Invalid response format' };
    }
    
    return { 
      success: true, 
      data: data.otherContacts || []
    };
  } catch (error) {
    console.error("Error fetching other contacts:", error);
    return { success: false, data: [], error: error.message };
  }
};

// Main handler for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gmail-Token, X-Client-Info, apikey, x-api-key, range, cache-control, x-supabase-auth, x-auth-token, Accept, Origin, Referer, User-Agent'
      }
    });
  }

  try {
    // Check if the request has proper authorization
    const apiKey = req.headers.get('apikey') || req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!apiKey) {
      console.error('Missing API key in request headers');
      return new Response(JSON.stringify({
        error: 'Unauthorized: Missing API key'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    // Get the Gmail token from the header
    const gmailToken = req.headers.get('X-Gmail-Token');
    console.log('Gmail token present:', !!gmailToken);
    if (!gmailToken) {
      return new Response(JSON.stringify({
        error: 'No Gmail token provided'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get and validate the request body
    let body;
    try {
      body = await req.json();
      console.log('Request body:', {
        has_integration_id: !!body.integration_id,
        has_access_token: !!body.access_token,
        has_refresh_token: !!body.refresh_token,
        include_no_email: body.include_no_email
      });
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(JSON.stringify({
        error: 'Invalid request body'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { integration_id, access_token, refresh_token, include_no_email = false } = body;

    if (!integration_id) {
      return new Response(JSON.stringify({
        error: 'No integration ID provided'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!access_token) {
      return new Response(JSON.stringify({
        error: 'No access token provided'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validate the access token first
    try {
      console.log("Validating access token...");
      const tokenInfoUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${access_token}`;
      const tokenResponse = await fetch(tokenInfoUrl);
      
      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text();
        console.error("Access token validation failed:", tokenError);
        return new Response(JSON.stringify({
          error: 'Access token is invalid or expired. Please reconnect your Gmail account.',
          details: tokenError
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
      
      const tokenInfo = await tokenResponse.json();
      console.log("Token validation successful:", {
        expiresIn: tokenInfo.expires_in,
        scope: tokenInfo.scope,
        hasContactsScope: tokenInfo.scope.includes('contacts'),
        hasOtherContactsScope: tokenInfo.scope.includes('contacts.other.readonly')
      });
      
      // Check for any contacts-related scope that might be present
      const hasContactsScope = 
        tokenInfo.scope.includes('contacts') || 
        tokenInfo.scope.includes('people') ||
        tokenInfo.scope.includes('https://www.googleapis.com/auth/contacts') || 
        tokenInfo.scope.includes('https://www.googleapis.com/auth/contacts.readonly');
        
      const hasOtherContactsScope = 
        tokenInfo.scope.includes('contacts.other.readonly') ||
        tokenInfo.scope.includes('https://www.googleapis.com/auth/contacts.other.readonly');

      if (!hasContactsScope && !hasOtherContactsScope) {
        console.error("Missing required contacts scope");
        return new Response(JSON.stringify({
          error: 'Gmail integration is missing the required contacts scope. Please reconnect with proper permissions.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        });
      }

      console.log("Scopes validation:", {
        hasContactsScope,
        hasOtherContactsScope,
        willFetchMainContacts: hasContactsScope,
        willFetchOtherContacts: hasOtherContactsScope
      });

      const contacts: Contact[] = [];

      // Fetch main contacts if we have the scope
      if (hasContactsScope) {
        console.log("Starting main contacts fetch with access token:", access_token.substring(0, 10) + '...');
        const mainContactsResult = await fetchMainContacts(access_token);
        if (mainContactsResult.success) {
          console.log(`Successfully fetched ${mainContactsResult.data.length} main contacts`);
          contacts.push(...mainContactsResult.data.map(contact => ({ ...contact, type: 'main' as const })));
        } else {
          console.error('Failed to fetch main contacts:', mainContactsResult.error);
        }
      }

      // Fetch other contacts if we have the scope
      if (hasOtherContactsScope) {
        console.log("Starting other contacts fetch...");
        const otherContactsResult = await fetchOtherContacts(access_token);
        if (otherContactsResult.success) {
          console.log(`Successfully fetched ${otherContactsResult.data.length} other contacts`);
          contacts.push(...otherContactsResult.data.map(contact => ({ ...contact, type: 'other' as const })));
        } else {
          console.error('Failed to fetch other contacts:', otherContactsResult.error);
        }
      }

      console.log(`Total contacts before processing: ${contacts.length}`);
      console.log('Contact types breakdown:', {
        total: contacts.length,
        main: contacts.filter(c => c.type === 'main').length,
        other: contacts.filter(c => c.type === 'other').length
      });

      if (contacts.length === 0) {
        console.error('No contacts found from Gmail API - check token validity and API response.');
        return new Response(JSON.stringify({
          contacts: [],
          error: 'No contacts found in Gmail account'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Process contacts before returning
      const processedContacts = contacts.map(contact => {
        // Get primary name
        const primaryName = contact.names?.find(n => n.metadata?.primary) || contact.names?.[0];
        
        // Get primary email
        const primaryEmail = contact.emailAddresses?.find(e => e.metadata?.primary) || contact.emailAddresses?.[0];
        
        // Get primary organization (only for main contacts)
        const primaryOrg = contact.type === 'main' ? 
          (contact.organizations?.find(o => o.metadata?.primary) || contact.organizations?.[0]) : null;
        
        // Get primary phone
        const primaryPhone = contact.phoneNumbers?.find(p => p.metadata?.primary) || contact.phoneNumbers?.[0];

        // Determine if this is a main contact or other contact
        const isOtherContact = contact.resourceName?.startsWith('otherContacts/');
        
        return {
          firstName: primaryName?.givenName || '',
          lastName: primaryName?.familyName || '',
          email: primaryEmail?.value || '',
          phone: primaryPhone?.value || '',
          title: primaryOrg?.title || '',
          company: primaryOrg?.name || '',
          source: isOtherContact ? 'gmail-other' : 'gmail',
          tags: isOtherContact ? ['gmail-other'] : ['gmail'],
          type: isOtherContact ? 'other' : 'main'
        };
      });

      // Filter contacts based on include_no_email parameter
      const filteredContacts = include_no_email 
        ? processedContacts 
        : processedContacts.filter(contact => contact.email);

      console.log(`Returning ${filteredContacts.length} contacts (${processedContacts.filter(c => c.type === 'other').length} other contacts)`);

      return new Response(JSON.stringify({
        contacts: filteredContacts,
        stats: {
          total: filteredContacts.length,
          mainContacts: filteredContacts.filter(c => c.type === 'main').length,
          otherContacts: filteredContacts.filter(c => c.type === 'other').length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } catch (validationError) {
      console.error("Error validating token:", validationError);
      return new Response(JSON.stringify({
        error: 'Failed to validate access token',
        details: validationError instanceof Error ? validationError.message : String(validationError)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Gmail-Token, X-Client-Info, apikey, x-api-key, range, cache-control, x-supabase-auth, x-auth-token, Accept, Origin, Referer, User-Agent'
      },
      status: 400,
    });
  }
}); 