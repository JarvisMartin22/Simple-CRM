import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// Global variable to track if listener is attached
let isMessageListenerAttached = false;
let activeAuthPopup: Window | null = null;
let authPromiseResolve: ((value: boolean) => void) | null = null;

export function useGmailConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
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
        // Call Gmail auth endpoint with the code
        console.log('Calling Gmail auth endpoint with code');
        const tokenResponse = await supabase.functions.invoke('gmail-auth', {
          body: { code: data.code }
        });
        
        if (tokenResponse.error) {
          throw new Error(tokenResponse.error);
        }
        
        console.log('Token response received:', tokenResponse);
        
        // Save integration data to database
        console.log('Saving integration data to database');
        const { error: integrationError } = await supabase
          .from('user_integrations')
          .upsert({
            user_id: user?.id,
            ...tokenResponse.data
          });
          
        if (integrationError) {
          console.error('Error saving integration:', integrationError);
          
          // If we get a 406 error, try to save to localStorage as fallback
          if ((integrationError as any).status === 406) {
            console.log('Got 406 error, saving to localStorage as fallback');
            localStorage.setItem('gmail_integration', JSON.stringify({
              user_id: user?.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...tokenResponse.data
            }));
            
            // Don't throw, continue with toast notification
            console.log('Integration data saved to localStorage');
          } else {
            throw integrationError;
          }
        } else {
          console.log('Integration data saved successfully to database');
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
            
            // If the popup was closed without completing auth
            if (authPromiseResolve) {
              setIsConnecting(false);
              authPromiseResolve(false);
              authPromiseResolve = null;
            }
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