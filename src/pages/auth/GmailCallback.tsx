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
  
  console.log('🚀 GMAIL CALLBACK COMPONENT: Mounted/Rendered');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🔥 GMAIL CALLBACK: Starting handleCallback function');
      
      // Debug: Log the current URL and parameters
      const currentUrl = window.location.href;
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const oauthError = params.get('error');
      
      console.log('🚨 CRITICAL DEBUG INFO:');
      console.log('Current URL:', currentUrl);
      console.log('Expected path: /auth/callback/gmail');
      console.log('Actual path:', window.location.pathname);
      console.log('Is correct callback path?', window.location.pathname === '/auth/callback/gmail');
      console.log('Full search params:', window.location.search);
      console.log('Code present:', !!code);
      console.log('State present:', !!state);
      console.log('Error present:', !!oauthError);
      
      // Enhanced popup detection for COOP-restricted environments (moved outside try block)
      const hasOAuthParams = code && state;
      const fromGoogle = document.referrer.includes('accounts.google.com');
      const traditionalPopupDetection = window.name === 'gmail_auth' || 
                                       (window.opener !== null && window.opener !== window);
      
      // Additional detection methods for COOP environments
      const hasPopupFeatures = window.outerWidth <= 700 && window.outerHeight <= 800; // Popup-sized window
      const isPopupContext = window !== window.top; // Not the top-level window
      const hasAuthFlow = hasOAuthParams && (fromGoogle || window.location.search.includes('code='));
      
      // Force popup mode if any reliable indicator suggests we're in a popup
      // In COOP environments, we rely heavily on OAuth params + context clues
      // AGGRESSIVE: If we have OAuth code AND state params, it's almost certainly a popup
      const isPopup = traditionalPopupDetection || 
                     (hasAuthFlow && (hasPopupFeatures || isPopupContext)) ||
                     (hasOAuthParams && fromGoogle) ||
                     (hasOAuthParams && window.location.search.includes('state=')) ||
                     (hasOAuthParams && window.location.hostname !== 'localhost') ||
                     (code && state); // MOST AGGRESSIVE: Any OAuth callback with both code and state is a popup
      
      try {
        if (oauthError) {
          throw new Error(`OAuth error: ${oauthError}`);
        }
        
        if (!code) {
          throw new Error('No authorization code received');
        }
        
        console.log('🔍 Popup detection analysis:', { 
          hasOpener: window.opener !== null, 
          isNotSelf: window.opener !== window,
          hasOAuthParams,
          fromGoogle,
          hasPopupFeatures,
          isPopupContext,
          hasAuthFlow,
          traditionalPopupDetection,
          hostname: window.location.hostname,
          isNotLocalhost: window.location.hostname !== 'localhost',
          hasCodeAndState: code && state,
          FINAL_isPopup: isPopup,
          windowName: window.name,
          windowSize: `${window.outerWidth}x${window.outerHeight}`,
          origin: window.location.origin,
          parentOrigin: window.opener ? 'present' : 'none',
          fullURL: window.location.href
        });
        
        // Log the decision making process
        if (isPopup) {
          if (traditionalPopupDetection) {
            console.log('✅ Popup detected via traditional method (window.opener or window.name)');
          } else if (code && state) {
            console.log('✅ Popup detected via AGGRESSIVE method (has both code and state params)');
          } else if (hasOAuthParams && window.location.hostname !== 'localhost') {
            console.log('✅ Popup detected via hostname method (OAuth params + non-localhost)');
          } else {
            console.log('✅ Popup detected via other method');
          }
        } else {
          console.log('❌ NOT detected as popup - will redirect to /integrations');
        }

        if (isPopup) {
          console.log('Detected popup window - will process auth and close');
          // We're in a popup - process the auth code and then communicate success
          // Continue to process the code below, then close the popup
        } else {
          console.log('Not in popup - normal page flow');
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
        
        console.log('🎯 DECISION POINT: isPopup =', isPopup);
        
        if (isPopup) {
          // We're in a popup - show success and try to communicate with parent
          console.log('✅ POPUP PATH: Entering popup mode - will show success UI and return early');
          console.log('📧 Gmail: In popup mode, showing success message');
          
          // Always show success message first
          document.body.innerHTML = `
            <div style="text-align: center; padding: 40px; font-family: Arial, sans-serif;">
              <h2 style="color: green;">✅ Gmail Connected Successfully!</h2>
              <p>Connected as: ${data.email}</p>
              <p>Please refresh the main application to see the connection.</p>
              <button onclick="window.close()" style="padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Close Window</button>
            </div>
          `;
          
          // Try to send message to parent (will fail due to COOP but that's ok)
          try {
            console.log('📧 Gmail: Attempting to send success message to parent');
            window.opener.postMessage({
              type: 'GMAIL_AUTH_SUCCESS',
              email: data.email,
              provider: 'gmail'
            }, window.location.origin);
            console.log('📧 Gmail: Success message sent (if COOP allows)');
          } catch (e) {
            console.log('📧 Gmail: PostMessage blocked by COOP (expected):', e.message);
          }
          
          // IMPORTANT: Return early to prevent any navigation
          return;
        } else {
          // Not in popup, show toast and redirect
          console.log('❌ NON-POPUP PATH: Will redirect to /integrations');
          console.log('📧 Gmail: Not in popup mode, showing toast and redirecting');
          
          toast({
            title: "Gmail connected successfully",
            description: `Connected as ${data.email}`,
          });
          
          // Redirect back to the integrations page
          setTimeout(() => {
            console.log('🔄 REDIRECTING to:', GMAIL_OAUTH_CONFIG.SUCCESS_REDIRECT);
            navigate(GMAIL_OAUTH_CONFIG.SUCCESS_REDIRECT);
          }, 1500);
        }
        
      } catch (error) {
        console.error('Error in Gmail callback:', error);
        setError(error instanceof Error ? error.message : 'Failed to connect Gmail account');
        setProcessing(false);
        
        if (isPopup) {
          // Try to send error message to parent
          try {
            console.log('📧 Gmail: Sending error message to parent window');
            window.opener.postMessage({
              type: 'GMAIL_AUTH_ERROR',
              error: error instanceof Error ? error.message : 'Failed to connect Gmail account'
            }, window.location.origin);
            
            console.log('📧 Gmail: Error message sent, closing popup in 3 seconds');
          } catch (e) {
            console.error('📧 Gmail: Failed to send error to parent:', e);
            // If postMessage fails, show manual error message
            document.body.innerHTML = `
              <div style="text-align: center; padding: 40px; font-family: Arial, sans-serif;">
                <h2 style="color: red;">❌ Gmail Connection Failed</h2>
                <p>Error: ${error instanceof Error ? error.message : 'Failed to connect Gmail account'}</p>
                <p>You can close this window and try again.</p>
                <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
              </div>
            `;
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