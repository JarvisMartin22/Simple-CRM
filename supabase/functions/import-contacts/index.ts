import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImportContact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  company: string | null;
  title: string | null;
  phone: string | null;
  website: string | null;
  domain?: string | null;
  company_id?: string;
  tags: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId, contacts, source } = await req.json();
    
    if (!userId || !contacts || !Array.isArray(contacts)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Check for test mode
    const url = new URL(req.url);
    const testMode = url.searchParams.get('testMode') === 'true';
    
    if (testMode) {
      console.log("RUNNING IN TEST MODE - No database changes will be made");
      console.log(`Received ${contacts.length} contacts for user ${userId}`);
      
      // Validate input contact format
      const validationResults = contacts.map(contact => {
        const issues = [];
        
        // Check required fields
        if (!contact.first_name) issues.push("Missing first_name");
        if (!contact.email) issues.push("Missing email");
        
        // Check data types
        if (contact.tags && !Array.isArray(contact.tags)) issues.push("tags is not an array");
        
        return {
          contact: {
            id: contact.id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            company: contact.company,
            title: contact.title,
            tags: contact.tags
          },
          valid: issues.length === 0,
          issues: issues
        };
      });
      
      return new Response(
        JSON.stringify({
          message: "Test mode - data validated without database changes",
          validationResults,
          userId,
          source
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    console.log(`Importing ${contacts.length} contacts for user ${userId} from ${source}`);
    console.log("First contact sample:", JSON.stringify(contacts[0]));
    
    // First fetch existing contacts by email to prevent duplicates
    console.log("Checking for existing contacts to avoid duplicates");
    const { data: existingContacts, error: existingError } = await supabase
      .from('contacts')
      .select('email')
      .eq('user_id', userId);
      
    if (existingError) {
      console.error("Error fetching existing contacts:", existingError);
    }
    
    // Create a Set of lowercase emails for fast lookup
    const existingEmails = new Set<string>();
    if (existingContacts) {
      existingContacts.forEach(contact => {
        if (contact.email) {
          existingEmails.add(contact.email.toLowerCase());
        }
      });
    }
    console.log(`Found ${existingEmails.size} existing contacts`);
    
    // Process domains and create companies where needed
    const domains = new Set<string>();
    const domainToCompanyMap = new Map<string, string>(); // Domain to company ID mapping
    
    contacts.forEach(contact => {
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
        console.log(`Company already exists for domain ${domain}: ${existingCompanies[0].id}`);
        domainToCompanyMap.set(domain, existingCompanies[0].id);
      } else {
        // Create new company
        const companyName = extractCompanyNameFromDomain(domain);
        console.log(`Creating new company for domain ${domain}: ${companyName}`);
        
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
          console.log(`Created new company with ID: ${newCompany.id}`);
          domainToCompanyMap.set(domain, newCompany.id);
        }
      }
    }
    
    // Process tags
    const uniqueTags = new Set<string>();
    contacts.forEach(contact => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    
    console.log(`Processing ${uniqueTags.size} unique tags`);
    
    // Ensure all tags exist in the tags table
    for (const tagName of uniqueTags) {
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('user_id', userId)
        .eq('name', tagName)
        .eq('entity_type', 'contact');
        
      if (!existingTag || existingTag.length === 0) {
        // Create tag
        console.log(`Creating tag: ${tagName}`);
        await supabase
          .from('tags')
          .insert({
            user_id: userId,
            name: tagName,
            color: getRandomColor(),
            entity_type: 'contact',
            created_at: new Date().toISOString()
          });
      }
    }
    
    // Insert contacts in batches
    const results = {
      created: 0,
      errors: 0,
      skipped: 0
    };
    
    console.log(`Starting to process ${contacts.length} contacts`);
    
    for (const contact of contacts) {
      try {
        // Skip if contact doesn't have required fields
        if (!contact.email) {
          console.log(`Skipping contact missing email: ${contact.first_name} ${contact.last_name}`);
          results.skipped++;
          continue;
        }
        
        // Skip if email already exists (case insensitive check)
        if (contact.email && existingEmails.has(contact.email.toLowerCase())) {
          console.log(`Skipping existing contact: ${contact.email}`);
          results.skipped++;
          continue;
        }
        
        // Link contact to company if domain is not common email provider
        let company_id = null;
        if (contact.domain && !isCommonEmailDomain(contact.domain)) {
          company_id = domainToCompanyMap.get(contact.domain) || null;
          if (company_id) {
            console.log(`Linking contact ${contact.email} to company ID: ${company_id}`);
          }
        }
        
        // Remove non-DB fields from contact before inserting
        const { domain, company, tags, ...contactData } = contact;
        
        // Create full name from first and last name
        const fullName = `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim();
        
        // Prepare contact data for insertion
        const contactInsertData = {
          ...contactData,
          // Ensure all string fields have proper values or null
          first_name: contactData.first_name || null,
          last_name: contactData.last_name || null,
          email: contactData.email || null, // This should never be null due to our filter above
          phone: contactData.phone || null,
          title: contactData.title || null,
          website: contactData.website || null,
          full_name: fullName || null,
          user_id: userId,
          source: source || 'manual',
          // Ensure tags is properly formatted as a Postgres array
          tags: Array.isArray(contact.tags) ? contact.tags : [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Only add company_id if we have one (to avoid foreign key issues)
        if (company_id) {
          contactInsertData.company_id = company_id;
        }
        
        // Log message with name, email, and tags (if available)
        console.log(`Creating contact: ${contactData.email || (contactData.first_name + ' ' + contactData.last_name)} with tags:`, 
          JSON.stringify(contactInsertData.tags));
        
        // Create contact
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert(contactInsertData)
          .select('id')
          .single();
          
        if (error) {
          console.error(`Error creating contact ${contactData.email || (contactData.first_name + ' ' + contactData.last_name)}:`, error);
          results.errors++;
          
          // Log detailed error information for debugging
          console.error("Full error details:", JSON.stringify(error));
          
          // Check for common errors
          if (error.code === '23505') {
            console.log("Duplicate key violation - contact may already exist");
          } else if (error.code === '23503') {
            console.log("Foreign key violation - referenced entity may not exist");
          }
        } else {
          console.log(`Created contact with ID: ${newContact.id}`);
          results.created++;
          
          // Create initial activity entry
          await supabase
            .from('contact_activities')
            .insert({
              user_id: userId,
              contact_id: newContact.id,
              activity_type: 'created',
              title: 'Contact created',
              description: `Contact imported from ${source}`,
              created_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error(`Error processing contact ${contact.email}:`, error);
        results.errors++;
      }
    }
    
    console.log(`Import complete. Created: ${results.created}, Errors: ${results.errors}, Skipped: ${results.skipped}`);
    
    return new Response(
      JSON.stringify({
        message: "Import complete",
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Import contacts error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

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

// Helper function to generate random color for tags
function getRandomColor(): string {
  const colors = [
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#0EA5E9', // Sky Blue
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#22C55E', // Emerald
    '#9b87f5', // Indigo
    '#FB7185', // Rose
  ];
  return colors[Math.floor(Math.random() * colors.length)];
} 