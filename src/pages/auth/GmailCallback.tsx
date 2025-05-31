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
        // Get the authorization code from the URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        if (!code) {
          throw new Error('No authorization code received');
        }

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
          body: { code }
        });

        if (error) {
          console.error('Error from gmail-auth function:', error);
          throw new Error(error.message || 'Failed to authenticate with Gmail');
        }

        if (!data) {
          throw new Error('No data received from authentication service');
        }

        console.log('Authentication successful');
        setProcessing(false);
        
        // Check if we're in a popup window
        const isPopup = window.opener !== null;
        
        if (isPopup) {
          // Send message to parent window
          try {
            window.opener.postMessage({
              type: 'GMAIL_AUTH_SUCCESS',
              email: data.email
            }, window.location.origin);
          } catch (e) {
            console.log('Could not send message to opener:', e);
          }
          
          // Close the popup after a short delay
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          // Not in popup, show toast and redirect
          toast({
            title: "Gmail connected successfully",
            description: `Connected as ${data.email}`,
          });
          
          // Redirect back to the integrations page
          setTimeout(() => {
            navigate('/app/integrations');
          }, 1500);
        }
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
          } catch (e) {
            console.log('Could not send error message to opener:', e);
          }
          
          // Close popup after showing error
          setTimeout(() => {
            window.close();
          }, 3000);
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