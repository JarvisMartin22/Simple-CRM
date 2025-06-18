import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { supabaseWithAuth } from '@/lib/supabaseWithAuth';
import { useToast } from '@/components/ui/use-toast';
import { GMAIL_OAUTH_CONFIG, getGmailRedirectUri } from '@/config/gmail';

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
          // We're in a popup - try postMessage first, then localStorage fallback
          try {
            // Try postMessage first
            window.opener.postMessage({
              type: 'GMAIL_AUTH_CODE',
              code: code,
              state: state
            }, window.location.origin);
            
            console.log('Successfully sent auth code via postMessage');
            
            // Close the popup after a short delay
            setTimeout(() => {
              window.close();
            }, 1000);
            
            // Don't process the code here - let the parent handle it
            return;
          } catch (e) {
            console.error('postMessage failed (likely COOP), using localStorage fallback:', e);
            
            // Fallback: Process the code ourselves and write result to localStorage
            console.log('Processing auth code via localStorage fallback...');
          }
        }

        // Process the code (either for localStorage fallback or normal flow)
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
        
        // Exchange the code for tokens using the simple auth function
        const { data, error } = await supabaseWithAuth.functions.invoke(GMAIL_OAUTH_CONFIG.EDGE_FUNCTION, {
          body: { 
            code,
            redirectUri: getGmailRedirectUri()
          }
        });

        if (error) {
          console.error('Error from gmail-auth function:', error);
          throw new Error(typeof error === 'string' ? error : error.message || 'Failed to authenticate with Gmail');
        }

        if (!data) {
          throw new Error('No data received from authentication service');
        }

        console.log('Authentication successful, saving integration...');
        
        // Save the integration to the database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('No authenticated user found');
        }

        // Check for existing integration
        const { data: existingIntegration, error: checkError } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'gmail')
          .maybeSingle();
          
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing integration:', checkError);
          throw new Error(`Database error: ${checkError.message}`);
        }

        const integrationData = {
          user_id: user.id,
          provider: data.provider || "gmail",
          provider_user_id: data.provider_user_id || null,
          email: data.email || null,
          access_token: data.access_token || "",
          refresh_token: data.refresh_token || null,
          expires_at: typeof data.expires_at === 'number' 
            ? new Date(data.expires_at).toISOString() 
            : data.expires_at,
          scope: data.scope || null
        };

        let saveResult;
        if (existingIntegration) {
          // Update existing integration
          saveResult = await supabase
            .from('user_integrations')
            .update({
              ...integrationData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingIntegration.id)
            .select();
        } else {
          // Insert new integration
          saveResult = await supabase
            .from('user_integrations')
            .insert({
              ...integrationData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select();
        }

        if (saveResult.error) {
          console.error('Error saving integration:', saveResult.error);
          throw new Error(`Failed to save integration: ${saveResult.error.message}`);
        }

        console.log('Integration saved successfully');
        setProcessing(false);
        
        if (isPopup) {
          // We're in a popup - write success to localStorage and close
          const successResult = {
            success: true,
            email: data.email,
            timestamp: Date.now()
          };
          
          localStorage.setItem('gmail_auth_result', JSON.stringify(successResult));
          console.log('📧 Gmail: Wrote success result to localStorage:', successResult);
          
          // Close the popup
          setTimeout(() => {
            console.log('📧 Gmail: Closing popup window...');
            window.close();
          }, 500);
        } else {
          // Not in popup, show toast and redirect
          toast({
            title: "Gmail connected successfully",
            description: `Connected as ${data.email}`,
          });
          
          // Redirect back to the integrations page
          setTimeout(() => {
            navigate(GMAIL_OAUTH_CONFIG.SUCCESS_REDIRECT);
          }, 1500);
        }
        
      } catch (error) {
        console.error('Error in Gmail callback:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect Gmail account');
        setProcessing(false);
        
        if (isPopup) {
          // Try postMessage first, then localStorage fallback
          try {
            window.opener.postMessage({
              type: 'GMAIL_AUTH_ERROR',
              error: error instanceof Error ? error.message : 'Failed to connect Gmail account'
            }, window.location.origin);
            
            console.log('Successfully sent error via postMessage');
          } catch (e) {
            console.log('postMessage failed, using localStorage fallback for error:', e);
            
            // Fallback: Write error to localStorage
            localStorage.setItem('gmail_auth_result', JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Failed to connect Gmail account',
              timestamp: Date.now()
            }));
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
          setTimeout(() => navigate(GMAIL_OAUTH_CONFIG.SUCCESS_REDIRECT), 3000);
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