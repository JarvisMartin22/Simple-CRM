import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Global variable to track if listener is attached
let isMessageListenerAttached = false;
let activeAuthPopup: Window | null = null;
let authPromiseResolve: ((value: boolean) => void) | null = null;

// Function to check localStorage for auth code (temporary - will be removed)
async function processStoredAuthCode(user: any, queryClient: any, toast: any): Promise<boolean> {
  try {
    const storedCode = localStorage.getItem('gmail_auth_code');
    const timestamp = localStorage.getItem('gmail_auth_timestamp');
    
    if (!storedCode || !timestamp) return false;
    
    // Only process codes that are less than 10 minutes old
    const codeTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const tenMinutes = 10 * 60 * 1000;
    
    if (now - codeTime > tenMinutes) {
      // Code is too old, remove it
      localStorage.removeItem('gmail_auth_code');
      localStorage.removeItem('gmail_auth_timestamp');
      return false;
    }
    
    console.log('Found stored auth code, processing...');
    
    // Call Gmail auth endpoint with the code
    const tokenResponse = await supabase.functions.invoke('gmail-auth', {
      body: { code: storedCode }
    });
    
    if (tokenResponse.error) {
      console.error('Error processing stored auth code:', tokenResponse.error);
      return false;
    }
    
    console.log('Token response data from stored code:', JSON.stringify(tokenResponse.data));
    console.log('Token response structure check:', {
      hasProvider: 'provider' in tokenResponse.data,
      hasAccessToken: 'access_token' in tokenResponse.data,
      dataType: typeof tokenResponse.data,
      hasUrl: 'url' in tokenResponse.data // Check if we're getting an auth URL instead of tokens
    });
    
    // Extract only the fields that exist in the user_integrations table
    // Use default values for required fields to prevent null constraint errors
    const integrationData = {
      user_id: user?.id,
      provider: tokenResponse.data.provider || "gmail", // Default to "gmail" if not provided
      provider_user_id: tokenResponse.data.provider_user_id || null,
      email: tokenResponse.data.email || null,
      access_token: tokenResponse.data.access_token || "",
      refresh_token: tokenResponse.data.refresh_token || null,
      expires_at: tokenResponse.data.expires_at || null,
      scope: tokenResponse.data.scope || null
    };
    
    console.log('Integration data constructed (stored code):', {
      provider: integrationData.provider,
      access_token_exists: !!integrationData.access_token,
      email: integrationData.email
    });
    
    // Validate required fields are present
    if (!integrationData.provider || !integrationData.access_token) {
      console.error('Missing required fields for integration from stored code', integrationData);
      return false;
    }
    
    // Make sure all required fields are present
    if (!integrationData.email) {
      console.error('Missing required email field in integration data');
      
      // Try to get email from userInfo if available
      if (tokenResponse.data && tokenResponse.data.email) {
        console.log('Using email from token response:', tokenResponse.data.email);
        integrationData.email = tokenResponse.data.email;
      } else {
        console.error('Cannot save integration: email is required');
        // Set a fallback email based on user if available
        integrationData.email = user?.email || 'unknown@example.com';
      }
    }
    
    try {
      // First, check if there's an existing integration for this user and provider
      const { data: existingIntegration, error: checkError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('provider', integrationData.provider)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking existing integration:', checkError);
        throw new Error(`Database error checking existing integration: ${checkError.message}`);
      }
      
      let result;
      
      if (existingIntegration) {
        console.log('Updating existing integration');
        // Update the existing integration
        result = await supabase
          .from('user_integrations')
          .update({
            ...integrationData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingIntegration.id)
          .select();
      } else {
        console.log('Creating new integration');
        // Insert a new integration
        result = await supabase
          .from('user_integrations')
          .insert({
            ...integrationData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
      }
      
      const { error: integrationError, data: savedData } = result;
        
      if (integrationError) {
        console.error('Error saving integration:', integrationError);
        console.error('Error details:', JSON.stringify(integrationError));
        throw new Error(`Database error saving integration: ${integrationError.message}`);
      } else {
        console.log('Integration data saved successfully to database:', savedData);
      }
    } catch (error) {
      console.error('Unexpected error saving integration:', error);
      // Don't save to localStorage - fail instead
      toast({
        title: "Failed to save integration",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
    
    toast({
      title: "Gmail connected successfully",
      description: `Connected as ${tokenResponse.data.email}`,
    });
    
    // Invalidate all queries that might depend on email connection
    queryClient.invalidateQueries({ queryKey: ['gmail-integration'] });
    queryClient.invalidateQueries({ queryKey: ['email-integration'] });
    queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
    queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    
    // Remove the stored code since it's been used
    localStorage.removeItem('gmail_auth_code');
    localStorage.removeItem('gmail_auth_timestamp');
    
    return true;
  } catch (error) {
    console.error('Error processing stored auth code:', error);
    return false;
  }
}

export function useGmailConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Check for stored auth code on component mount
  useEffect(() => {
    if (user?.id) {
      processStoredAuthCode(user, queryClient, toast).then(success => {
        if (success) {
          console.log('Successfully processed stored auth code');
        }
      });
    }
  }, [user?.id]);

  // Define message handler function
  const handleAuthMessage = async (event: MessageEvent) => {
    console.log('Received message event:', event);
    
    // Process message from auth popup
    const data = event.data;
    if (data && data.type === 'GMAIL_AUTH_CODE' && data.code) {
      console.log('Auth code received from popup');
      
      // Make sure we have an active promise resolver
      if (!authPromiseResolve) {
        console.error('No active promise resolver found');
        return;
      }
      
      try {
        // Call Gmail auth endpoint with the code
        console.log('Calling Gmail auth endpoint with code');
        const tokenResponse = await supabase.functions.invoke('gmail-auth', {
          body: { code: data.code }
        });
        
        if (tokenResponse.error) {
          throw new Error(tokenResponse.error);
        }
        
        console.log('Token response received:', tokenResponse);
        console.log('Token response data:', JSON.stringify(tokenResponse.data));
        console.log('Token response structure check:', {
          hasProvider: 'provider' in tokenResponse.data,
          hasAccessToken: 'access_token' in tokenResponse.data,
          dataType: typeof tokenResponse.data,
          hasUrl: 'url' in tokenResponse.data // Check if we're getting an auth URL instead of tokens
        });
        
        // Extract only the fields that exist in the user_integrations table
        // Use default values for required fields to prevent null constraint errors
        const integrationData = {
          user_id: user?.id,
          provider: tokenResponse.data.provider || "gmail", // Default to "gmail" if not provided
          provider_user_id: tokenResponse.data.provider_user_id || null,
          email: tokenResponse.data.email || null,
          access_token: tokenResponse.data.access_token || "",
          refresh_token: tokenResponse.data.refresh_token || null,
          expires_at: tokenResponse.data.expires_at || null,
          scope: tokenResponse.data.scope || null
        };
        
        console.log('Integration data constructed (popup):', {
          provider: integrationData.provider,
          access_token_exists: !!integrationData.access_token,
          email: integrationData.email
        });
        
        // Validate required fields are present
        if (!integrationData.provider || !integrationData.access_token) {
          console.error('Missing required fields for integration', integrationData);
          throw new Error('Missing required fields for integration');
        }
        
        // Make sure all required fields are present
        if (!integrationData.email) {
          console.error('Missing required email field in integration data');
          
          // Try to get email from userInfo if available
          if (tokenResponse.data && tokenResponse.data.email) {
            console.log('Using email from token response:', tokenResponse.data.email);
            integrationData.email = tokenResponse.data.email;
          } else {
            console.error('Cannot save integration: email is required');
            // Set a fallback email based on user if available
            integrationData.email = user?.email || 'unknown@example.com';
          }
        }
        
        try {
          // First, check if there's an existing integration for this user and provider
          const { data: existingIntegration, error: checkError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', user?.id)
            .eq('provider', integrationData.provider)
            .maybeSingle();
            
          if (checkError) {
            console.error('Error checking existing integration:', checkError);
            throw new Error(`Database error checking existing integration: ${checkError.message}`);
          }
          
          let result;
          
          if (existingIntegration) {
            console.log('Updating existing integration');
            // Update the existing integration
            result = await supabase
              .from('user_integrations')
              .update({
                ...integrationData,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingIntegration.id)
              .select();
          } else {
            console.log('Creating new integration');
            // Insert a new integration
            result = await supabase
              .from('user_integrations')
              .insert({
                ...integrationData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select();
          }
          
          const { error: integrationError, data: savedData } = result;
            
          if (integrationError) {
            console.error('Error saving integration:', integrationError);
            console.error('Error details:', JSON.stringify(integrationError));
            throw new Error(`Database error saving integration: ${integrationError.message}`);
          } else {
            console.log('Integration data saved successfully to database:', savedData);
          }
        } catch (error) {
          console.error('Unexpected error saving integration:', error);
          // Don't save to localStorage - fail instead
          toast({
            title: "Failed to save integration",
            description: `Error: ${error.message}`,
            variant: "destructive"
          });
          throw error; // Propagate the error
        }
        
        toast({
          title: "Gmail connected successfully",
          description: `Connected as ${tokenResponse.data.email}`,
        });
        
        // Invalidate all queries that might depend on email connection
        console.log('Invalidating queries');
        queryClient.invalidateQueries({ queryKey: ['gmail-integration'] });
        queryClient.invalidateQueries({ queryKey: ['email-integration'] });
        queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
        queryClient.invalidateQueries({ queryKey: ['email-stats'] });
        
        // Close the popup if it's still open
        if (activeAuthPopup && !activeAuthPopup.closed) {
          activeAuthPopup.close();
        }
        
        // Reset state and resolve promise
        setIsConnecting(false);
        
        if (authPromiseResolve) {
          authPromiseResolve(true);
          authPromiseResolve = null;
        }
      } catch (error) {
        console.error('Error processing auth code:', error);
        
        // Close the popup if it's still open
        if (activeAuthPopup && !activeAuthPopup.closed) {
          activeAuthPopup.close();
        }
        
        setIsConnecting(false);
        
        toast({
          title: "Connection failed",
          description: error.message || "Failed to connect to Gmail.",
          variant: "destructive"
        });
        
        if (authPromiseResolve) {
          authPromiseResolve(false);
          authPromiseResolve = null;
        }
      }
    }
  };

  // Set up global message listener when the hook is first used
  useEffect(() => {
    if (!isMessageListenerAttached) {
      console.log('Attaching global message event listener');
      window.addEventListener('message', handleAuthMessage);
      isMessageListenerAttached = true;
      
      // Cleanup function
      return () => {
        console.log('Removing global message event listener');
        window.removeEventListener('message', handleAuthMessage);
        isMessageListenerAttached = false;
      };
    }
  }, []);

  const connectGmail = async () => {
    try {
      console.log('Starting Gmail connection process');
      setIsConnecting(true);
      
      // Call the Gmail auth Edge Function to get OAuth URL
      console.log('Requesting OAuth URL from Edge Function');
      const response = await supabase.functions.invoke('gmail-auth');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log('Received OAuth URL:', response.data.url);
      
      // Open OAuth URL in a popup window
      const authUrl = response.data.url;
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      console.log('Opening OAuth popup window');
      const popup = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please enable popups for this site.');
      }
      
      // Store reference to active popup
      activeAuthPopup = popup;
      
      // Return a promise that will be resolved when auth is complete
      return new Promise<boolean>((resolve) => {
        // Store the resolve function to be called when message is received
        authPromiseResolve = resolve;
        
        // Also handle popup closure without authentication
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            console.log('Popup closed by user without completing auth');
            clearInterval(checkClosed);
            
            // Check if we have a stored auth code as a fallback
            processStoredAuthCode(user, queryClient, toast).then(success => {
              if (success) {
                console.log('Successfully processed stored auth code after popup closed');
                // If we have successfully processed the stored auth code, resolve the promise
                if (authPromiseResolve) {
                  setIsConnecting(false);
                  authPromiseResolve(true);
                  authPromiseResolve = null;
                  return;
                }
              }
              
              // If there's no stored auth code or processing failed, just resolve the promise as failed
              if (authPromiseResolve) {
                setIsConnecting(false);
                authPromiseResolve(false);
                authPromiseResolve = null;
              }
            });
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      setIsConnecting(false);
      
      toast({
        title: "Connection failed",
        description: "There was an error connecting to Gmail.",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Helper function to force reset connection state 
  // (useful if the UI gets stuck in connecting state)
  const resetConnectionState = () => {
    setIsConnecting(false);
    authPromiseResolve = null;
    activeAuthPopup = null;
  };
  
  return { connectGmail, isConnecting, resetConnectionState };
} 