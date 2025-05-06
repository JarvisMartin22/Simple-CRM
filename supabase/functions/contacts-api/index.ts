
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validate API key from request headers
async function validateApiKey(apiKey: string): Promise<{ valid: boolean, userId?: string }> {
  if (!apiKey) return { valid: false };

  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('api_key', apiKey)
    .eq('revoked', false)
    .single();

  if (error || !data) return { valid: false };

  // Update last_used_at timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('api_key', apiKey);

  return { valid: true, userId: data.user_id };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    const authResult = await validateApiKey(apiKey || '');
    
    if (!authResult.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    if (path[0] === 'contacts') {
      const userId = authResult.userId;
      
      // List all contacts
      if (req.method === 'GET' && !path[1]) {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', userId);
          
        if (error) throw error;
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get a single contact
      if (req.method === 'GET' && path[1]) {
        const contactId = path[1];
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .eq('user_id', userId)
          .single();
          
        if (error) {
          return new Response(
            JSON.stringify({ error: 'Contact not found' }), 
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Create a new contact
      if (req.method === 'POST') {
        const contact = await req.json();
        
        const { data, error } = await supabase
          .from('contacts')
          .insert([{ ...contact, user_id: userId }])
          .select();
          
        if (error) throw error;
        
        return new Response(
          JSON.stringify(data[0]),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Update a contact
      if (req.method === 'PUT' && path[1]) {
        const contactId = path[1];
        const updates = await req.json();
        
        const { data, error } = await supabase
          .from('contacts')
          .update(updates)
          .eq('id', contactId)
          .eq('user_id', userId)
          .select();
          
        if (error) throw error;
        
        if (data.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Contact not found' }), 
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        return new Response(
          JSON.stringify(data[0]),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Delete a contact
      if (req.method === 'DELETE' && path[1]) {
        const contactId = path[1];
        
        const { error } = await supabase
          .from('contacts')
          .delete()
          .eq('id', contactId)
          .eq('user_id', userId);
          
        if (error) throw error;
        
        return new Response(
          null,
          { 
            status: 204, 
            headers: corsHeaders
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
