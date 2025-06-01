// Debug script to check Gmail Auth issues
async function debugGmailAuth() {
  console.log("=== Gmail Auth Debug Script ===");
  
  // Check if we have multiple Supabase instances
  console.log("Checking for Supabase instances in window:");
  const supabaseKeys = Object.keys(window).filter(key => key.includes('supabase') || key.includes('SUPABASE'));
  console.log("Found keys:", supabaseKeys);
  
  // Import the Supabase client from the app
  try {
    // Check environment variables
    console.log("\n=== Environment Variables ===");
    console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("VITE_SUPABASE_ANON_KEY length:", import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
    console.log("VITE_SUPABASE_FUNCTIONS_URL:", import.meta.env.VITE_SUPABASE_FUNCTIONS_URL);
    
    // Check session
    console.log("\n=== Session Check ===");
    const { supabase } = await import('/src/integrations/supabase/client.ts');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
    } else {
      console.log("Session exists:", !!session);
      console.log("Session user:", session?.user?.email);
      console.log("Access token length:", session?.access_token?.length);
      console.log("Access token prefix:", session?.access_token?.substring(0, 20) + "...");
    }
    
    // Try to get user
    console.log("\n=== User Check ===");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("User error:", userError);
    } else {
      console.log("User exists:", !!user);
      console.log("User ID:", user?.id);
      console.log("User email:", user?.email);
    }
    
    // Test the edge function directly
    console.log("\n=== Testing Edge Function ===");
    if (session) {
      try {
        const response = await supabase.functions.invoke('gmail-auth', {
          body: { test: true },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        console.log("Edge function response:", response);
        
        if (response.error) {
          console.error("Edge function error:", response.error);
          
          // Try to parse the error details
          if (response.error.message) {
            console.log("Error message:", response.error.message);
            if (response.error.message.includes('non-2xx status code')) {
              const statusMatch = response.error.message.match(/status code: (\d+)/);
              if (statusMatch) {
                console.log("HTTP Status:", statusMatch[1]);
              }
            }
          }
        } else {
          console.log("Success! Auth URL:", response.data?.url?.substring(0, 100) + "...");
        }
      } catch (e) {
        console.error("Exception calling edge function:", e);
      }
    } else {
      console.warn("No session available to test edge function");
    }
    
    // Check for multiple Supabase client imports
    console.log("\n=== Module Analysis ===");
    try {
      const client1 = await import('/src/integrations/supabase/client.ts');
      const client2 = await import('/src/lib/supabase.ts');
      const client3 = await import('/src/lib/supabaseClient.ts');
      
      console.log("Client 1 (integrations):", client1.supabase);
      console.log("Client 2 (lib/supabase):", client2.supabase);
      console.log("Client 3 (lib/supabaseClient):", client3.supabase);
      
      console.log("Are they the same instance?");
      console.log("Client 1 === Client 2:", client1.supabase === client2.supabase);
      console.log("Client 2 === Client 3:", client2.supabase === client3.supabase);
    } catch (e) {
      console.log("Could not compare all clients:", e.message);
    }
    
  } catch (error) {
    console.error("Debug script error:", error);
  }
}

// Run the debug script
debugGmailAuth();