/**
 * Gmail Connect Hook with localStorage Fallback
 * 
 * This version includes a fallback mechanism for environments where
 * Cross-Origin-Opener-Policy blocks popup communication.
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { supabaseWithAuth } from '@/lib/supabaseWithAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { GMAIL_OAUTH_CONFIG, getGmailRedirectUri } from '@/config/gmail';

// Global variables
let isMessageListenerAttached = false;
let activeAuthPopup: Window | null = null;
let authPromiseResolve: ((value: boolean) => void) | null = null;
let isPollingLocalStorage = false;

const REDIRECT_TIMEOUT_MS = GMAIL_OAUTH_CONFIG.REDIRECT_TIMEOUT_MS;

export function useGmailConnectWithFallback() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const [lastProcessedCode, setLastProcessedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // localStorage polling fallback for COOP-restricted environments
  const startLocalStoragePolling = () => {
    if (isPollingLocalStorage) return;
    
    console.log('📧 Gmail: Starting localStorage polling fallback...');
    isPollingLocalStorage = true;
    
    const pollInterval = setInterval(() => {
      const authResult = localStorage.getItem('gmail_auth_result');
      if (authResult) {
        console.log('📧 Gmail: Found auth result in localStorage:', authResult);
        try {
          const result = JSON.parse(authResult);
          localStorage.removeItem('gmail_auth_result');
          isPollingLocalStorage = false;
          clearInterval(pollInterval);
          
          if (result.success) {
            toast({
              title: "Gmail connected successfully",
              description: `Connected as ${result.email}`,
            });
            
            queryClient.invalidateQueries({ queryKey: ['gmail-integration'] });
            queryClient.invalidateQueries({ queryKey: ['email-integration'] });
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
            queryClient.invalidateQueries({ queryKey: ['recent-emails'] });
            queryClient.invalidateQueries({ queryKey: ['email-stats'] });
            
            if (authPromiseResolve) {
              authPromiseResolve(true);
              authPromiseResolve = null;
            }
          } else {
            toast({
              title: "Connection failed",
              description: result.error || "Failed to connect Gmail",
              variant: "destructive"
            });
            
            if (authPromiseResolve) {
              authPromiseResolve(false);
              authPromiseResolve = null;
            }
          }
          
          setIsConnecting(false);
          setIsProcessingCode(false);
          
          if (activeAuthPopup) {
            try {
              if (!activeAuthPopup.closed) {
                activeAuthPopup.close();
              }
            } catch (e) {
              // Ignore COOP errors
            }
          }
        } catch (e) {
          console.error('Error parsing localStorage auth result:', e);
        }
      } else {
        // Log periodic polling (every 10 polls)
        const pollCount = (window as any).gmailPollCount || 0;
        (window as any).gmailPollCount = pollCount + 1;
        if (pollCount % 10 === 0) {
          console.log('📧 Gmail: Still polling localStorage... (poll #' + pollCount + ')');
        }
      }
    }, 500); // Poll more frequently (every 500ms)
    
    // Stop polling after timeout
    setTimeout(() => {
      if (isPollingLocalStorage) {
        clearInterval(pollInterval);
        isPollingLocalStorage = false;
        
        if (authPromiseResolve) {
          setIsConnecting(false);
          authPromiseResolve(false);
          authPromiseResolve = null;
          
          toast({
            title: "Authentication timeout",
            description: "The authentication process took too long. Please try again.",
            variant: "destructive"
          });
        }
      }
    }, REDIRECT_TIMEOUT_MS);
  };
  
  // Original postMessage handler (for when COOP allows it)
  const handleAuthMessage = async (event: MessageEvent) => {
    const data = event.data;
    
    if (data && data.type === 'GMAIL_AUTH_SUCCESS') {
      console.log('📧 Gmail: Connection successful via postMessage!');
      setIsConnecting(false);
      setIsProcessingCode(false);
      
      toast({
        title: "Gmail connected successfully",
        description: `Connected as ${data.email}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['gmail-integration'] });
      queryClient.invalidateQueries({ queryKey: ['email-integration'] });
      
      if (authPromiseResolve) {
        authPromiseResolve(true);
        authPromiseResolve = null;
      }
      return;
    }
    
    if (data && data.type === 'GMAIL_AUTH_ERROR') {
      console.error('📧 Gmail: Connection failed via postMessage:', data.error);
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
  };

  // Set up message listener
  useEffect(() => {
    if (!isMessageListenerAttached) {
      window.addEventListener('message', handleAuthMessage);
      isMessageListenerAttached = true;
      
      return () => {
        window.removeEventListener('message', handleAuthMessage);
        isMessageListenerAttached = false;
      };
    }
  }, []);

  const connectGmail = async () => {
    try {
      // Verify authentication
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        toast({
          title: "Authentication required",
          description: "Please log in before connecting Gmail",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('Gmail: Starting connection process...');
      setIsConnecting(true);
      
      // Get OAuth URL
      const response = await supabaseWithAuth.functions.invoke(GMAIL_OAUTH_CONFIG.EDGE_FUNCTION, {
        body: { 
          test: true,
          redirectUri: getGmailRedirectUri()
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to get authorization URL');
      }
      
      if (!response.data?.url) {
        throw new Error('Invalid response: Missing authorization URL');
      }
      
      // Store state for verification
      if (response.data.state) {
        localStorage.setItem('gmail_auth_state', response.data.state);
        localStorage.setItem('gmail_auth_timestamp', Date.now().toString());
      }
      
      // Create auth promise
      const authPromise = new Promise<boolean>((resolve) => {
        authPromiseResolve = resolve;
      });
      
      // Calculate popup position
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      // Log the OAuth URL for debugging
      console.log('📧 Gmail: Opening OAuth URL:', response.data.url);
      
      // Open popup
      activeAuthPopup = window.open(
        response.data.url,
        'gmail_auth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
      
      if (!activeAuthPopup) {
        setIsConnecting(false);
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log('📧 Gmail: Popup opened successfully');
      
      // Start localStorage polling as fallback
      startLocalStoragePolling();
      
      // Monitor popup closure (simplified - don't rely on window.closed due to COOP)
      const popupCheckInterval = setInterval(() => {
        // Just check if the popup reference exists
        // COOP will prevent us from checking window.closed, so we rely on localStorage polling
        if (!activeAuthPopup) {
          clearInterval(popupCheckInterval);
        }
      }, 5000); // Check less frequently since we can't reliably detect closure
      
      // Set timeout
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
              // Ignore COOP errors
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
      
      // Wait for completion
      const result = await authPromise;
      
      // Cleanup
      clearTimeout(timeoutId);
      clearInterval(popupCheckInterval);
      
      return result;
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
  
  const resetConnectionState = () => {
    setIsConnecting(false);
  };
  
  return { connectGmail, isConnecting, resetConnectionState };
}