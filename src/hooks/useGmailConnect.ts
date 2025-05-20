import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Global variable to track if listener is attached
let isMessageListenerAttached = false;
let activeAuthPopup: Window | null = null;
let authPromiseResolve: ((value: boolean) => void) | null = null;

// Configure this based on your app's needs
const POPUP_TIMEOUT_MS = 120000; // 2 minutes

export function useGmailConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  
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
        // Verify authentication is still active but don't fail immediately
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session verification error:', sessionError);
          // Continue with the process but log the error
        }
        
        if (!sessionData?.session) {
          console.warn('No active session found, attempting to refresh');
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.error('Could not refresh session:', refreshError);
            // Continue with the process but log the error
          } else {
            console.log('Session refreshed successfully');
          }
        }
        
        // Get the latest user information since the session might have refreshed
        const { data: latestUserData } = await supabase.auth.getUser();
        const currentUser = latestUserData?.user || user;
        
        if (!currentUser?.id) {
          console.error('No authenticated user found after token acquisition');
          throw new Error('Authentication required to save integration');
        }
        
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
          user_id: currentUser.id, // Use the most current user ID
          provider: tokenResponse.data.provider || "gmail", // Default to "gmail" if not provided
          provider_user_id: tokenResponse.data.provider_user_id || null,
          email: tokenResponse.data.email || null,
          access_token: tokenResponse.data.access_token || "",
          refresh_token: tokenResponse.data.refresh_token || null,
          expires_at: tokenResponse.data.expires_at || null,
          scope: tokenResponse.data.scope || null
        };
        
        console.log('Integration data constructed:', {
          provider: integrationData.provider,
          access_token_exists: !!integrationData.access_token,
          email: integrationData.email,
          user_id: integrationData.user_id // Log the user_id to verify it matches the authenticated user
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
            integrationData.email = currentUser.email || 'unknown@example.com';
          }
        }
        
        try {
          // First, check if there's an existing integration for this user and provider
          const { data: existingIntegration, error: checkError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('provider', integrationData.provider)
            .maybeSingle();
            
          if (checkError) {
            console.error('Error checking existing integration:', checkError);
            
            // Special handling for auth errors
            if (checkError.code === '42501') {
              console.error('Row-level security violation. User authentication issue.');
              throw new Error('Authentication error: Please log in again to connect Gmail');
            }
            
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
          
          const { error: integrationError } = result;
          let savedData = result.data;
            
          if (integrationError) {
            console.error('Error saving integration:', integrationError);
            console.error('Error details:', JSON.stringify(integrationError));
            
            // Special handling for unique constraint violations
            if (integrationError.code === '23505') {
              console.log('Duplicate record detected, integration already exists');
              
              // Instead of throwing an error, just fetch the current record
              const { data: existingData, error: fetchError } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('provider', integrationData.provider)
                .maybeSingle();
                
              if (fetchError) {
                console.error('Error fetching existing integration:', fetchError);
                throw new Error(`Database error fetching existing integration: ${fetchError.message}`);
              }
              
              // Use the existing data instead
              console.log('Using existing integration data');
              savedData = existingData;
              
              // Continue with success flow
            } else if (integrationError.code === '42501') {
              // Special handling for RLS violations
              console.error('Row-level security violation. User authentication issue.');
              throw new Error('Authentication error: Please log in again to connect Gmail');
            } else {
              throw new Error(`Database error saving integration: ${integrationError.message}`);
            }
          } 
          
          console.log('Integration data saved/retrieved successfully:', savedData);
          
          toast({
            title: "Gmail connected successfully",
            description: `Connected as ${integrationData.email}`,
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
          console.error('Unexpected error saving integration:', error);
          toast({
            title: "Failed to save integration",
            description: `Error: ${error.message}`,
            variant: "destructive"
          });
          throw error; // Propagate the error
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
      // Verify authentication before starting the connection process
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error retrieving session:', sessionError);
        toast({
          title: "Authentication error",
          description: "There was a problem with your session. Try logging out and back in.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!sessionData?.session) {
        console.warn('No active session found, attempting to refresh');
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          toast({
            title: "Session expired",
            description: "Please log in again to connect Gmail",
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Get the latest user info
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || user;
      
      if (!currentUser?.id) {
        toast({
          title: "Authentication required",
          description: "Please log in before connecting Gmail",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('Starting Gmail connection process with user:', currentUser.id);
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
          // Safe check to see if popup exists and is closed
          try {
            if (!popup || popup.closed) {
              console.log('Popup closed by user without completing auth');
              clearInterval(checkClosed);
              
              if (authPromiseResolve) {
                setIsConnecting(false);
                authPromiseResolve(false);
                authPromiseResolve = null;
              }
            }
          } catch (err) {
            // Handle any errors accessing the popup (like cross-origin issues)
            console.error('Error checking popup state:', err);
            clearInterval(checkClosed);
            
            if (authPromiseResolve) {
              setIsConnecting(false);
              authPromiseResolve(false);
              authPromiseResolve = null;
            }
          }
        }, 1000);
        
        // Add a timeout to prevent waiting indefinitely
        setTimeout(() => {
          if (authPromiseResolve) {
            console.log('Connection timeout reached, cleaning up');
            
            toast({
              title: "Connection timeout",
              description: "Gmail connection process took too long. Please try again.",
              variant: "destructive"
            });
            setIsConnecting(false);
            authPromiseResolve(false);
            authPromiseResolve = null;
          }
        }, POPUP_TIMEOUT_MS);
      });
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      setIsConnecting(false);
      
      toast({
        title: "Connection failed",
        description: error.message || "There was an error connecting to Gmail.",
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