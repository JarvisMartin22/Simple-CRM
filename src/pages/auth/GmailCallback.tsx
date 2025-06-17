import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export default function GmailCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Debug: Log the current URL and parameters
        const currentUrl = window.location.href;
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const oauthError = params.get('error');
        
        if (oauthError) {
          throw new Error(`OAuth error: ${oauthError}`);
        }
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Check if we're in a popup window
        const isPopup = window.opener !== null;

        if (isPopup) {
          // We're in a popup - send the code to the parent and close
          try {
            // Send message to parent window with the auth code
            window.opener.postMessage({
              type: 'GMAIL_AUTH_CODE',
              code: code,
              state: state
            }, window.location.origin);
            
            // Close the popup after a short delay
            setTimeout(() => {
              window.close();
            }, 1000);
            
            // Don't process the code here - let the parent handle it
            return;
          } catch (e) {
            console.error('Error communicating with parent window:', e);
            // Fallback: process the code ourselves
          }
        }

        // If we're not in a popup or communication failed, process the code ourselves
        console.log('Received auth code, processing...');
        
        // Check state parameter if it exists (CSRF protection)
        const savedState = localStorage.getItem('gmail_auth_state');
        if (state && savedState && state !== savedState) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }
        
        // Clear the saved state
        if (savedState) {
          localStorage.removeItem('gmail_auth_state');
        }

        console.log('Received auth code, processing...');
        
        // Exchange the code for tokens
        const { data, error } = await supabase.functions.invoke('gmail-auth', {
          body: { 
            code,
            redirectUri: `${window.location.origin}/auth/callback/gmail`
          }
        });

        if (error) {
          console.error('Error from gmail-auth function:', error);
          throw new Error(typeof error === 'string' ? error : error.message || 'Failed to authenticate with Gmail');
        }

        if (!data) {
          throw new Error('No data received from authentication service');
        }

        console.log('Authentication successful');
        setProcessing(false);
        
        // Not in popup, show toast and redirect
        toast({
          title: "Gmail connected successfully",
          description: `Connected as ${data.email}`,
        });
        
        // Redirect back to the integrations page
        setTimeout(() => {
          navigate('/app/integrations');
        }, 1500);
        
      } catch (error) {
        console.error('Error in Gmail callback:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect Gmail account');
        setProcessing(false);
        
        const isPopup = window.opener !== null;
        
        if (isPopup) {
          // Send error message to parent window
          try {
            window.opener.postMessage({
              type: 'GMAIL_AUTH_ERROR',
              error: error instanceof Error ? error.message : 'Failed to connect Gmail account'
            }, window.location.origin);
            
            // Close popup after showing error
            setTimeout(() => {
              window.close();
            }, 3000);
          } catch (e) {
            console.log('Could not send error message to opener:', e);
          }
        } else {
          // Show error toast
          toast({
            title: "Connection failed",
            description: error instanceof Error ? error.message : 'Failed to connect Gmail account',
            variant: "destructive"
          });
          
          // Redirect after a short delay to show the error
          setTimeout(() => navigate('/app/integrations'), 3000);
        }
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold mb-4 text-red-600">Connection Failed</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </>
        ) : processing ? (
          <>
            <h1 className="text-2xl font-semibold mb-4">Connecting Gmail...</h1>
            <div className="flex justify-center my-4">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
            <p className="text-gray-600">Please wait while we complete the connection process.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-4 text-green-600">Connection Successful!</h1>
            <p className="text-gray-600 mb-4">Your Gmail account has been connected successfully.</p>
            <p className="text-sm text-gray-500">Redirecting you back...</p>
          </>
        )}
      </div>
    </div>
  );
}