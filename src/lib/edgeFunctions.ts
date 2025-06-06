import { supabase } from '@/lib/supabase';

interface EdgeFunctionOptions {
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

interface EdgeFunctionResponse {
  data: any;
  error: Error | null;
}

/**
 * Wrapper for Supabase edge functions that handles development mode gracefully
 */
export const invokeEdgeFunction = async (
  functionName: string, 
  options: EdgeFunctionOptions = {}
): Promise<EdgeFunctionResponse> => {
  const isDevelopment = window.location.hostname === 'localhost';
  
  if (isDevelopment) {
    // In development, return mock responses for non-critical functions
    console.log(`🔧 Development Mode: Mock response for edge function "${functionName}"`, options);
    
    switch (functionName) {
      case 'send-email':
        return {
          data: { success: true, message: 'Email sent (development mode)' },
          error: null
        };
        
      case 'sync-contacts':
        return {
          data: { success: true, message: 'Contacts synced (development mode)' },
          error: null
        };
        
      case 'sync-emails':
        return {
          data: { success: true, message: 'Emails synced (development mode)' },
          error: null
        };
        
      case 'send-invitation':
        return {
          data: { 
            success: true, 
            message: 'Invitation sent (development mode)',
            inviteUrl: `${window.location.origin}/auth/accept-invitation?token=demo-token`
          },
          error: null
        };
        
      case 'check-spam-score':
        return {
          data: { 
            score: Math.random() * 5, // Random score between 0-5
            rating: 'Good',
            suggestions: ['Consider shorter subject line', 'Add more personal content']
          },
          error: null
        };
        
      case 'outlook-auth':
        return {
          data: { 
            success: true, 
            message: 'Outlook auth (development mode)',
            authUrl: '#demo-outlook-auth'
          },
          error: null
        };
        
      default:
        // For unknown functions, return a generic error
        return {
          data: null,
          error: new Error(`Edge function "${functionName}" not available in development mode`)
        };
    }
  }
  
  // In production, call the actual edge function
  try {
    const response = await supabase.functions.invoke(functionName, options);
    return response;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown edge function error')
    };
  }
};