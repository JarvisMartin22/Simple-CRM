import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced Supabase client that ensures auth headers are properly passed to edge functions
 */
export const supabaseWithAuth = {
  ...supabase,
  
  functions: {
    ...supabase.functions,
    
    invoke: async (functionName: string, options?: any) => {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session and no Authorization header is explicitly set, add it
      if (session && (!options?.headers || !options.headers.Authorization)) {
        options = {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${session.access_token}`
          }
        };
      }
      
      // Call the original invoke method
      return supabase.functions.invoke(functionName, options);
    }
  }
};