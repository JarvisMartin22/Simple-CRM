import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { supabaseWithAuth } from '@/lib/supabaseWithAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Global variable to track if listener is attached
let isMessageListenerAttached = false;
let activeAuthPopup: Window | null = null;
let authPromiseResolve: ((value: boolean) => void) | null = null;

// Configure this based on your app's needs
const REDIRECT_TIMEOUT_MS = 120000; // 2 minutes

export function useGmailConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const [lastProcessedCode, setLastProcessedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Define message handler function
  const handleAuthMessage = async (event: MessageEvent) => {
    // Process message from auth popup
    const data = event.data;
    
    // Handle success message from callback page
    if (data && data.type === 'GMAIL_AUTH_SUCCESS') {
      console.log('📧 Gmail: Connection successful!');
      setIsConnecting(false);
      setIsProcessingCode(false);
      
      toast({
        title: "Gmail connected successfully",
        description: `Connected as ${data.email}`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['gmail-integration'] });
      queryClient.invalidateQueries({ queryKey: ['email-integration'] });
      queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      
      if (authPromiseResolve) {
        authPromiseResolve(true);
        authPromiseResolve = null;
      }
      return;
    }
    
    // Handle error message from callback page
    if (data && data.type === 'GMAIL_AUTH_ERROR') {
      console.error('📧 Gmail: Connection failed:', data.error);
      setIsConnecting(false);
      setIsProcessingCode(false);
      
      toast({
        title: "Connection failed",
        description: data.error || "Failed to connect Gmail",
        variant: "destructive"
      });
      
      if (authPromiseResolve) {
        authPromiseResolve(false);
        authPromiseResolve = null;
      }
      return;
    }
    
    if (data && data.type === 'GMAIL_AUTH_CODE' && data.code) {
      console.log('📧 Gmail: Processing auth code...');
      
      // Make sure we have an active promise resolver
      if (!authPromiseResolve) {
        console.warn('Gmail: No active auth session found');
        return;
      }
      
      // Check if we're already processing a code or if this is a duplicate
      if (isProcessingCode) {
        console.log('Gmail: Auth already in progress, ignoring duplicate');
        return;
      }
      
      // Check if this is the same code we just processed
      if (lastProcessedCode === data.code) {
        console.log('Gmail: Ignoring duplicate auth code');
        return;
      }
      
      // Set processing state and save code for deduplication
      setIsProcessingCode(true);
      setLastProcessedCode(data.code);
      
      try {
        // Verify authentication is still active but don't fail immediately
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Gmail: Session verification warning:', sessionError.message);
        }
        
        if (!sessionData?.session) {
          console.log('Gmail: Refreshing session...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.warn('Gmail: Could not refresh session');
          }
        }
        
        // Get the latest user information since the session might have refreshed
        const { data: latestUserData } = await supabase.auth.getUser();
        const currentUser = latestUserData?.user || user;
        
        if (!currentUser?.id) {
          throw new Error('Authentication required to save integration');
        }
        
        // Get session for auth
        const { data: { session } } = await supabase.auth.getSession();
        
        // Call Gmail auth endpoint with the code
        const tokenResponse = await supabaseWithAuth.functions.invoke('gmail-auth-simple', {
          body: { 
            code: data.code,
            redirectUri: `${window.location.origin}/auth/callback/gmail`
          }
        });
        
        if (tokenResponse.error) {
          // Only log and throw errors for genuinely failed attempts
          // Don't throw for 400 errors that might be followed by success
          if (tokenResponse.error.message && tokenResponse.error.message.includes('non-2xx status code')) {
            if (tokenResponse.error.message.includes('400')) {
              console.log('Gmail: Received 400 error, waiting for potential retry...');
              
              // Set a shorter timeout for 400 errors since they often resolve quickly
              setTimeout(() => {
                if (isProcessingCode && lastProcessedCode === data.code) {
                  console.warn('Gmail: 400 error timeout, connection may have failed');
                  setIsProcessingCode(false);
                  setIsConnecting(false);
                  
                  if (authPromiseResolve) {
                    authPromiseResolve(false);
                    authPromiseResolve = null;
                  }
                  
                  toast({
                    title: "Connection failed",
                    description: "OAuth authentication failed. Please try again.",
                    variant: "destructive"
                  });
                }
              }, 3000); // Shorter timeout for 400 errors
              
              return; // Don't throw immediately
            }
            
            if (tokenResponse.error.message.includes('500')) {
              console.log('Gmail: Server error, waiting for retry...');
              
              setTimeout(() => {
                if (isProcessingCode && lastProcessedCode === data.code) {
                  console.error('Gmail: Timeout waiting for server response');
                  setIsProcessingCode(false);
                  setIsConnecting(false);
                  
                  if (authPromiseResolve) {
                    authPromiseResolve(false);
                    authPromiseResolve = null;
                  }
                  
                  toast({
                    title: "Connection failed",
                    description: "Server error: The authentication service is experiencing issues. Please try again later.",
                    variant: "destructive"
                  });
                }
              }, 5000);
              
              return; // Don't throw - this allows success to be processed if it comes later
            }
            
            // Only throw OAuth service error for non-400/500 errors
            throw new Error('Gmail connection failed: OAuth service returned an error. Please check your Supabase project logs and verify the OAuth credentials are correctly configured.');
          }
          
          throw new Error(tokenResponse.error.message || 'Unknown error from Gmail auth endpoint');
        }

        // Extract only the fields that exist in the user_integrations table
        const integrationData = {
          user_id: currentUser.id,
          provider: tokenResponse.data.provider || "gmail",
          provider_user_id: tokenResponse.data.provider_user_id || null,
          email: tokenResponse.data.email || null,
          access_token: tokenResponse.data.access_token || "",
          refresh_token: tokenResponse.data.refresh_token || null,
          expires_at: typeof tokenResponse.data.expires_at === 'number' 
            ? new Date(tokenResponse.data.expires_at).toISOString() 
            : tokenResponse.data.expires_at,
          scope: tokenResponse.data.scope || null
        };
        
        // Validate required fields are present
        if (!integrationData.provider || !integrationData.access_token) {
          throw new Error('Missing required fields for integration');
        }
        
        // Make sure all required fields are present
        if (!integrationData.email) {
          if (tokenResponse.data && tokenResponse.data.email) {
            integrationData.email = tokenResponse.data.email;
          } else {
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
            // Special handling for auth errors
            if (checkError.code === '42501') {
              throw new Error('Authentication error: Please log in again to connect Gmail');
            }
            
            throw new Error(`Database error checking existing integration: ${checkError.message}`);
          }
          
          let result;
          
          if (existingIntegration) {
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
            // Special handling for unique constraint violations
            if (integrationError.code === '23505') {
              console.log('Gmail: Integration already exists, fetching current record');
              
              // Instead of throwing an error, just fetch the current record
              const { data: existingData, error: fetchError } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('provider', integrationData.provider)
                .maybeSingle();
                
              if (fetchError) {
                throw new Error(`Database error fetching existing integration: ${fetchError.message}`);
              }
              
              savedData = existingData;
            } else if (integrationError.code === '42501') {
              throw new Error('Authentication error: Please log in again to connect Gmail');
            } else {
              throw new Error(`Database error saving integration: ${integrationError.message}`);
            }
          } 
          
          console.log('✅ Gmail connected successfully:', integrationData.email);
          
          toast({
            title: "Gmail connected successfully",
            description: `Connected as ${integrationData.email}`,
          });
          
          // Invalidate all queries that might depend on email connection
          queryClient.invalidateQueries({ queryKey: ['gmail-integration'] });
          queryClient.invalidateQueries({ queryKey: ['email-integration'] });
          queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
          queryClient.invalidateQueries({ queryKey: ['email-stats'] });
          
          // Close the popup if it's still open
          if (activeAuthPopup) {
            try {
              if (!activeAuthPopup.closed) {
                activeAuthPopup.close();
              }
            } catch (e) {
              // Silently handle COOP policy restrictions
            }
          }
          
          // Reset state and resolve promise
          setIsConnecting(false);
          setIsProcessingCode(false);
          
          if (authPromiseResolve) {
            authPromiseResolve(true);
            authPromiseResolve = null;
          }
        } catch (error) {
          console.error('Gmail: Failed to save integration:', error.message);
          toast({
            title: "Failed to save integration",
            description: `Error: ${error.message}`,
            variant: "destructive"
          });
          throw error;
        }
      } catch (error) {
        console.error('Gmail: Auth processing failed:', error.message);
        
        // Close the popup if it's still open
        if (activeAuthPopup) {
          try {
            if (!activeAuthPopup.closed) {
              activeAuthPopup.close();
            }
          } catch (e) {
            // Silently handle COOP policy restrictions
          }
        }
        
        setIsConnecting(false);
        setIsProcessingCode(false);
        
        // Only show error toast for non-timeout errors
        // (timeout errors are handled by their respective timeouts)
        if (!error.message.includes('Server error') && !error.message.includes('OAuth authentication failed')) {
          toast({
            title: "Connection failed",
            description: error.message || "Failed to connect to Gmail.",
            variant: "destructive"
          });
        }
        
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
      window.addEventListener('message', handleAuthMessage);
      isMessageListenerAttached = true;
      
      // Cleanup function
      return () => {
        window.removeEventListener('message', handleAuthMessage);
        isMessageListenerAttached = false;
      };
    }
  }, []);

  // Check for auth code in URL (for redirect URI http://localhost:8080/integrations)
  useEffect(() => {
    // Only run this if we're on the Integrations page and not already connecting
    if (window.location.pathname.includes('/integrations') && !isConnecting) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code) {
        console.log('Auth code found in URL, processing...');
        
        // Check if this is a duplicate code
        if (lastProcessedCode === code) {
          console.log('Ignoring duplicate auth code from URL');
          
          // Clean up the URL
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          return;
        }
        
        // Check if already processing a code
        if (isProcessingCode) {
          console.log('Already processing an auth code, ignoring URL code');
          
          // Clean up the URL
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          return;
        }
        
        // Process the authorization code
        (async () => {
          setIsConnecting(true);
          setIsProcessingCode(true);
          setLastProcessedCode(code);
          
          try {
            // Get session for auth
            const { data: { session } } = await supabase.auth.getSession();
            
            // Call Gmail auth endpoint with the code
            const tokenResponse = await supabaseWithAuth.functions.invoke('gmail-auth-simple', {
              body: { 
                code: code,
                redirectUri: `${window.location.origin}/auth/callback/gmail`
              }
            });
            
            if (tokenResponse.error) {
              console.error('Error processing auth code from URL:', tokenResponse.error);
              
              // Check for specific error types
              if (tokenResponse.error.message && tokenResponse.error.message.includes('non-2xx status code')) {
                // Check if it's specifically a 500 error (Internal Server Error)
                if (tokenResponse.error.message.includes('500')) {
                  console.log('Received 500 error from Edge Function, will wait for secondary response...');
                  
                  // Set a timeout to wait for the secondary response
                  setTimeout(() => {
                    // If we're still processing the same code after 5 seconds, assume failure
                    if (isProcessingCode && lastProcessedCode === code) {
                      console.error('Timeout waiting for secondary response in URL flow');
                      setIsProcessingCode(false);
                      setIsConnecting(false);
                      
                      toast({
                        title: "Connection failed",
                        description: "Server error: The authentication service is experiencing issues. Please try again later.",
                        variant: "destructive"
                      });
                      
                      // Clean up the URL
                      const cleanUrl = window.location.pathname;
                      window.history.replaceState({}, document.title, cleanUrl);
                    }
                  }, 5000);
                  
                  // Return early without throwing - this allows the secondary successful response to be processed if it arrives
                  return;
                }
                
                throw new Error('Gmail connection failed: OAuth service returned an error. Please check your Supabase project logs and verify the OAuth credentials are correctly configured.');
              }
              
              throw new Error(tokenResponse.error.message || 'Failed to exchange authorization code');
            }
            
            console.log('Token response received from URL code');
            
            // Show success message
            toast({
              title: "Gmail connected successfully",
              description: `Connected as ${tokenResponse.data.email}`,
            });
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['gmail-integration'] });
            queryClient.invalidateQueries({ queryKey: ['email-integration'] });
            queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
            queryClient.invalidateQueries({ queryKey: ['email-stats'] });
            
          } catch (error) {
            console.error('Error processing auth code from URL:', error);
            toast({
              title: "Failed to connect Gmail",
              description: `Error: ${error.message}`,
              variant: "destructive"
            });
          } finally {
            setIsConnecting(false);
            setIsProcessingCode(false);
            
            // Clean up the URL to remove the code parameter
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        })();
      }
    }
  }, []);  // Only run this effect once on component mount

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
      
      console.log('Gmail: Starting connection process...');
      setIsConnecting(true);
      
      // Get the current session to ensure auth headers are included
      const { data: { session }, error: sessionError2 } = await supabase.auth.getSession();
      
      if (sessionError2 || !session) {
        throw new Error('No active session found');
      }
      
      // Call the Gmail auth Edge Function to get OAuth URL
      const response = await supabaseWithAuth.functions.invoke('gmail-auth-simple', {
        body: { 
          test: true,
          redirectUri: `${window.location.origin}/auth/callback/gmail`
        }
      });
      
      if (response.error) {
        // Check for specific error patterns
        if (response.error.message && response.error.message.includes('non-2xx status code')) {
          throw new Error(
            'Edge Function configuration error: Please check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET ' +
            'environment variables are properly set in your Supabase Edge Function.'
          );
        }
        
        throw new Error(response.error.message || 'Failed to get authorization URL');
      }
      
      if (!response.data || !response.data.url) {
        throw new Error('Invalid response from server: Missing authorization URL');
      }
      
      // Store the state parameter for CSRF verification if provided
      if (response.data.state) {
        localStorage.setItem('gmail_auth_state', response.data.state);
        localStorage.setItem('gmail_auth_timestamp', Date.now().toString());
      }
      
      // Create a promise that will be resolved when the auth flow completes
      const authPromise = new Promise<boolean>((resolve) => {
        authPromiseResolve = resolve;
      });
      
      // Calculate popup position for center of screen
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      // Open authorization URL in a popup window
      activeAuthPopup = window.open(
        response.data.url,
        'gmail_auth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      // Check if popup was blocked
      if (!activeAuthPopup || activeAuthPopup.closed) {
        setIsConnecting(false);
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive"
        });
        return false;
      }
      
      // Monitor the popup window
      const popupCheckInterval = setInterval(() => {
        try {
          // Check if the popup is closed (this may throw COOP errors)
          if (!activeAuthPopup || activeAuthPopup.closed) {
            clearInterval(popupCheckInterval);
            
            // If the auth promise hasn't been resolved yet, assume the user canceled
            if (authPromiseResolve) {
              setIsConnecting(false);
              authPromiseResolve(false);
              authPromiseResolve = null;
            }
          }
        } catch (e) {
          // COOP policy might block access to window.closed
          // This is expected behavior and not an error - just silently continue
          // The auth code handler or timeout will eventually resolve the authentication flow
        }
      }, 1000);
      
      // Set timeout to prevent hanging if auth takes too long
      const timeoutId = setTimeout(() => {
        if (authPromiseResolve) {
          console.log('Auth timeout reached, canceling...');
          clearInterval(popupCheckInterval);
          
          if (activeAuthPopup) {
            try {
              if (!activeAuthPopup.closed) {
                activeAuthPopup.close();
              }
            } catch (e) {
              // Silently handle COOP policy restrictions
            }
          }
          
          setIsConnecting(false);
          authPromiseResolve(false);
          authPromiseResolve = null;
          
          toast({
            title: "Authentication timeout",
            description: "The authentication process took too long. Please try again.",
            variant: "destructive"
          });
        }
      }, REDIRECT_TIMEOUT_MS);
      
      // Wait for the authentication to complete
      const result = await authPromise;
      
      // Clean up
      clearTimeout(timeoutId);
      clearInterval(popupCheckInterval);
      
      return result;
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      setIsConnecting(false);
      
      // Provide more user-friendly error messages
      let errorMessage = "There was an error connecting to Gmail.";
      
      if (error.message.includes('Invalid response')) {
        errorMessage = "Server configuration issue. Please contact support.";
      } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message.includes('Authentication')) {
        errorMessage = "Authentication error. Please try logging out and back in.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Connection timed out. Please try again later.";
      }
      
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Helper function to reset connection state if needed
  const resetConnectionState = () => {
    setIsConnecting(false);
  };
  
  return { connectGmail, isConnecting, resetConnectionState };
} 