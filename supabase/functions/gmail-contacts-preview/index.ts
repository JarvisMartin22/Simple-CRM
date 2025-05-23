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
}

// Function to fetch other contacts with detailed logging
const fetchOtherContacts = async (accessToken: string): Promise<{ success: boolean; data: Contact[]; error?: string }> => {
  try {
    console.log("Fetching other contacts...");
    // Only include fields that are allowed for other contacts
    const otherContactsUrl = 'https://people.googleapis.com/v1/otherContacts?pageSize=1000&readMask=names,emailAddresses,phoneNumbers,metadata';
    
    console.log("Other contacts request URL:", otherContactsUrl);
    console.log("Access token (first 10 chars):", accessToken.substring(0, 10));
    
    // First validate the token
    const tokenInfoUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`;
    const tokenResponse = await fetch(tokenInfoUrl);
    const tokenInfo = await tokenResponse.json();
    
    // Check if token is invalid
    if (tokenInfo.error) {
      console.error("Token validation failed:", tokenInfo);
      return { 
        success: false, 
        data: [], 
        error: `Invalid token: ${tokenInfo.error_description || tokenInfo.error}` 
      };
    }
    
    console.log("Token info:", {
      expiresIn: tokenInfo.expires_in,
      scope: tokenInfo.scope,
      hasContactsScope: tokenInfo.scope?.includes('contacts'),
      hasOtherContactsScope: tokenInfo.scope?.includes('contacts.other.readonly')
    });
    
    // Check required scopes
    const hasContactsScope = tokenInfo.scope?.includes('contacts') || 
      tokenInfo.scope?.includes('people') ||
      tokenInfo.scope?.includes('https://www.googleapis.com/auth/contacts') || 
      tokenInfo.scope?.includes('https://www.googleapis.com/auth/contacts.readonly');
      
    const hasOtherContactsScope = tokenInfo.scope?.includes('contacts.other.readonly') ||
      tokenInfo.scope?.includes('https://www.googleapis.com/auth/contacts.other.readonly');

    if (!hasContactsScope && !hasOtherContactsScope) {
      return {
        success: false,
        data: [],
        error: 'Token is missing required contacts scopes'
      };
    }
    
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
      headers: corsHeaders
    });
  }

  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      throw new Error('No access token provided');
    }

    // Fetch other contacts
    const result = await fetchOtherContacts(accessToken);
    
    return new Response(
      JSON.stringify({
        success: result.success,
        data: result.data,
        error: result.error
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.success ? 200 : 400
      }
    );

  } catch (error) {
    console.error('Error in request:', error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
}); 