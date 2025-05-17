import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImportContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    
    console.log(`Importing ${contacts.length} contacts for user ${userId} from ${source}`);
    
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
    
    // Process tags
    const uniqueTags = new Set<string>();
    contacts.forEach(contact => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    
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
      errors: 0
    };
    
    for (const contact of contacts) {
      try {
        // Link contact to company if domain is not common email provider
        let company_id = null;
        if (contact.domain && !isCommonEmailDomain(contact.domain)) {
          company_id = domainToCompanyMap.get(contact.domain) || null;
        }
        
        // Create contact data object, excluding non-DB fields
        const { domain, company, tags, ...contactData } = contact;
        
        // Create full name from first and last name
        const fullName = `${contactData.first_name} ${contactData.last_name}`.trim();
        
        // Create contact
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({
            ...contactData,
            full_name: fullName,
            company_id,
            user_id: userId,
            source: source || 'manual',
            tags: contact.tags || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (error) {
          console.error(`Error creating contact ${contact.email}:`, error);
          results.errors++;
        } else {
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