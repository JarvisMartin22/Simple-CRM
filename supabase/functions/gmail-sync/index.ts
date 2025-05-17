import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { userId, syncType = 'pull', forceSync = false } = body;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`Processing ${syncType} sync for user ${userId}`);
    
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

    let result = {};
    
    // Handle different sync types
    if (syncType === 'pull' || syncType === 'both') {
      const pullResult = await pullContactsFromGmail(userId, accessToken);
      result = { ...result, pull: pullResult };
    }
    
    if (syncType === 'push' || syncType === 'both') {
      const pushResult = await pushContactsToGmail(userId, accessToken, integration);
      result = { ...result, push: pushResult };
    }
    
    // Log the sync
    await supabase
      .from('sync_logs')
      .insert({
        user_id: userId,
        provider: 'gmail',
        operation: syncType,
        status: 'success',
        items_processed: (result.pull?.processed || 0) + (result.push?.processed || 0),
        created_at: new Date().toISOString()
      });
    
    return new Response(
      JSON.stringify({
        message: "Sync completed successfully",
        result
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Gmail sync error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Pull contacts from Gmail to the CRM
async function pullContactsFromGmail(userId: string, accessToken: string) {
  console.log("Pulling contacts from Gmail");
  
  try {
    // Fetch contacts from Gmail
    const response = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers,urls,metadata',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch contacts: ${error.error?.message || response.statusText}`);
    }
    
    const contactsData = await response.json();
    
    if (!contactsData.connections) {
      return { processed: 0, message: "No contacts found" };
    }
    
    // Process and map contacts to CRM format
    const processedContacts = contactsData.connections.map(contact => {
      const primaryName = contact.names ? contact.names.find(n => n.metadata?.primary) || contact.names[0] : null;
      const primaryEmail = contact.emailAddresses ? contact.emailAddresses.find(e => e.metadata?.primary) || contact.emailAddresses[0] : null;
      const primaryOrg = contact.organizations ? contact.organizations.find(o => o.metadata?.primary) || contact.organizations[0] : null;
      const primaryPhone = contact.phoneNumbers ? contact.phoneNumbers.find(p => p.metadata?.primary) || contact.phoneNumbers[0] : null;
      const primaryUrl = contact.urls ? contact.urls.find(u => u.metadata?.primary) || contact.urls[0] : null;
      
      // Extract domain from email
      const email = primaryEmail?.value || null;
      let domain = null;
      if (email && email.includes('@')) {
        domain = email.split('@')[1];
      }
      
      return {
        first_name: primaryName?.givenName || '',
        last_name: primaryName?.familyName || '',
        email: email,
        domain: domain,
        company_name: primaryOrg?.name || null,
        title: primaryOrg?.title || null,
        phone: primaryPhone?.value || null,
        website: primaryUrl?.value || null,
        source: 'gmail',
        external_id: contact.resourceName,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }).filter(contact => contact.email); // Only include contacts with an email address
    
    console.log(`Processing ${processedContacts.length} contacts`);
    
    // Process unique domains and create/update companies
    const domains = new Set<string>();
    const domainToCompanyMap = new Map<string, string>(); // Domain to company ID mapping
    
    processedContacts.forEach(contact => {
      if (contact.domain && !isCommonEmailDomain(contact.domain)) {
        domains.add(contact.domain);
      }
    });
    
    console.log(`Found ${domains.size} unique business domains`);
    
    // Check existing companies by domain
    for (const domain of domains) {
      const { data: existingCompanies } = await supabase
        .from('companies')
        .select('id, domain')
        .eq('user_id', userId)
        .eq('domain', domain);
        
      if (existingCompanies && existingCompanies.length > 0) {
        // Company already exists
        domainToCompanyMap.set(domain, existingCompanies[0].id);
      } else {
        // Create new company
        const companyName = extractCompanyNameFromDomain(domain);
        const { data: newCompany, error } = await supabase
          .from('companies')
          .insert({
            user_id: userId,
            name: companyName,
            domain: domain,
            website: `https://${domain}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (error) {
          console.error(`Error creating company for domain ${domain}:`, error);
        } else if (newCompany) {
          domainToCompanyMap.set(domain, newCompany.id);
        }
      }
    }
    
    // Insert or update contacts in the database
    let updated = 0;
    let created = 0;
    
    for (const contact of processedContacts) {
      // Try to find if contact already exists
      const { data: existingContacts, error: findError } = await supabase
        .from('contacts')
        .select('id, email, external_id')
        .eq('user_id', userId)
        .eq('email', contact.email);
        
      if (findError) {
        console.error(`Error finding contact with email ${contact.email}:`, findError);
        continue;
      }
      
      // Link contact to company if domain is not common email provider
      let company_id = null;
      if (contact.domain && !isCommonEmailDomain(contact.domain)) {
        company_id = domainToCompanyMap.get(contact.domain) || null;
      }
      
      // Create contact data object, excluding non-DB fields
      const { domain, company_name, ...contactData } = contact;
      
      // Add company_id to the contact data
      const contactWithCompany = {
        ...contactData,
        company_id
      };
      
      if (existingContacts && existingContacts.length > 0) {
        // Update existing contact
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            ...contactWithCompany,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContacts[0].id);
          
        if (updateError) {
          console.error(`Error updating contact ${contact.email}:`, updateError);
        } else {
          updated++;
        }
      } else {
        // Create new contact
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(contactWithCompany);
          
        if (insertError) {
          console.error(`Error creating contact ${contact.email}:`, insertError);
        } else {
          created++;
        }
      }
    }
    
    return { processed: processedContacts.length, created, updated };
  } catch (error) {
    console.error("Error pulling contacts from Gmail:", error);
    
    // Log error to sync_logs
    await supabase
      .from('sync_logs')
      .insert({
        user_id: userId,
        provider: 'gmail',
        operation: 'pull',
        status: 'error',
        error_message: error.message,
        created_at: new Date().toISOString()
      });
      
    throw error;
  }
}

// Helper function to check if domain is from common email providers
function isCommonEmailDomain(domain: string): boolean {
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com',
    'gmx.com', 'live.com', 'me.com', 'inbox.com', 'fastmail.com'
  ];
  return commonDomains.includes(domain.toLowerCase());
}

// Helper function to extract company name from domain
function extractCompanyNameFromDomain(domain: string): string {
  // Remove TLD
  let name = domain.split('.')[0];
  
  // Split by hyphens or numbers and take first part
  name = name.split(/[-0-9]/)[0];
  
  // Capitalize first letter of each word
  return name
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Push CRM contacts to Gmail
async function pushContactsToGmail(userId: string, accessToken: string, integration: any) {
  console.log("Pushing contacts to Gmail");
  
  try {
    // Get the timestamp of the last sync
    const { data: lastSync } = await supabase
      .from('sync_logs')
      .select('created_at')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .eq('operation', 'push')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const lastSyncTimestamp = lastSync?.created_at || '1970-01-01T00:00:00Z';
    
    // 1. Get contacts that have been updated since last sync
    const { data: updatedContacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .gt('updated_at', lastSyncTimestamp)
      .is('source', null) // Only sync contacts created in the CRM, not from Gmail
      .order('updated_at', { ascending: false });
      
    if (error) throw error;
    
    if (!updatedContacts || updatedContacts.length === 0) {
      return { processed: 0, message: "No contacts to push" };
    }
    
    console.log(`Pushing ${updatedContacts.length} contacts to Gmail`);
    
    let created = 0;
    let updated = 0;
    let failed = 0;
    
    // 2. For each updated contact, push to Gmail
    for (const contact of updatedContacts) {
      try {
        // Skip contacts without email
        if (!contact.email) {
          console.log(`Skipping contact without email: ${contact.id}`);
          continue;
        }
        
        // Check if contact already exists in Gmail by external_id
        if (contact.external_id && contact.external_id.startsWith('people/')) {
          // Update existing Gmail contact
          await updateGmailContact(accessToken, contact);
          updated++;
        } else {
          // Create new Gmail contact
          const newGmailContact = await createGmailContact(accessToken, contact);
          
          // Save the external ID back to our database
          await supabase
            .from('contacts')
            .update({
              external_id: newGmailContact.resourceName,
              source: 'crm_synced',
              updated_at: new Date().toISOString()
            })
            .eq('id', contact.id);
            
          created++;
        }
      } catch (error) {
        console.error(`Error pushing contact ${contact.id}:`, error);
        failed++;
      }
    }
    
    return {
      processed: updatedContacts.length,
      created,
      updated,
      failed,
      message: `Created ${created} and updated ${updated} contacts in Gmail (${failed} failed)`
    };
  } catch (error) {
    console.error("Error pushing contacts:", error);
    throw error;
  }
}

// Create a new contact in Gmail
async function createGmailContact(accessToken: string, contact: any) {
  const response = await fetch(
    'https://people.googleapis.com/v1/people:createContact',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        names: [
          {
            givenName: contact.first_name || '',
            familyName: contact.last_name || ''
          }
        ],
        emailAddresses: contact.email ? [
          {
            value: contact.email,
            type: 'work'
          }
        ] : [],
        phoneNumbers: contact.phone ? [
          {
            value: contact.phone,
            type: 'work'
          }
        ] : [],
        organizations: contact.company ? [
          {
            name: contact.company,
            title: contact.title || ''
          }
        ] : [],
        urls: contact.website ? [
          {
            value: contact.website,
            type: 'work'
          }
        ] : []
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create contact in Gmail: ${error.error?.message || response.statusText}`);
  }
  
  return await response.json();
}

// Update an existing contact in Gmail
async function updateGmailContact(accessToken: string, contact: any) {
  if (!contact.external_id) {
    throw new Error("Missing external_id for contact update");
  }
  
  const response = await fetch(
    `https://people.googleapis.com/v1/${contact.external_id}:updateContact?updatePersonFields=names,emailAddresses,organizations,phoneNumbers,urls`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        names: [
          {
            givenName: contact.first_name || '',
            familyName: contact.last_name || ''
          }
        ],
        emailAddresses: contact.email ? [
          {
            value: contact.email,
            type: 'work'
          }
        ] : [],
        phoneNumbers: contact.phone ? [
          {
            value: contact.phone,
            type: 'work'
          }
        ] : [],
        organizations: contact.company ? [
          {
            name: contact.company,
            title: contact.title || ''
          }
        ] : [],
        urls: contact.website ? [
          {
            value: contact.website,
            type: 'work'
          }
        ] : []
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update contact in Gmail: ${error.error?.message || response.statusText}`);
  }
  
  return await response.json();
} 