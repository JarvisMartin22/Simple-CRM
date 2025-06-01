import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useGmailConnectDebug() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const connectGmail = async () => {
    try {
      console.log('=== Gmail Connect Debug ===');
      setIsConnecting(true);
      const debug: any = {};

      // 1. Check user
      debug.user = {
        id: user?.id,
        email: user?.email,
        exists: !!user
      };
      console.log('1. User:', debug.user);

      // 2. Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      debug.session = {
        exists: !!session,
        error: sessionError?.message,
        accessToken: session?.access_token?.substring(0, 20) + '...',
        expiresAt: session?.expires_at,
        isExpired: session ? new Date().getTime() / 1000 > session.expires_at : null
      };
      console.log('2. Session:', debug.session);

      if (!session) {
        throw new Error('No active session');
      }

      // 3. Test direct fetch to edge function
      console.log('3. Testing direct fetch...');
      const supabaseUrl = 'https://bujaaqjxrvntcneoarkj.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';

      const fetchResponse = await fetch(`${supabaseUrl}/functions/v1/gmail-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ test: true })
      });

      const fetchData = await fetchResponse.json();
      debug.directFetch = {
        status: fetchResponse.status,
        ok: fetchResponse.ok,
        data: fetchData,
        headers: Object.fromEntries(fetchResponse.headers.entries())
      };
      console.log('3. Direct fetch result:', debug.directFetch);

      // 4. Test functions.invoke
      console.log('4. Testing functions.invoke...');
      const invokeResponse = await supabase.functions.invoke('gmail-auth', {
        body: { test: true },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      debug.functionsInvoke = {
        error: invokeResponse.error?.message,
        data: invokeResponse.data
      };
      console.log('4. Functions.invoke result:', debug.functionsInvoke);

      // 5. JWT decode
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        debug.jwt = {
          sub: payload.sub,
          role: payload.role,
          exp: payload.exp,
          expiresAt: new Date(payload.exp * 1000).toISOString()
        };
      } catch (e) {
        debug.jwt = { error: 'Could not decode JWT' };
      }
      console.log('5. JWT info:', debug.jwt);

      setDebugInfo(debug);
      
      // Show results
      if (fetchResponse.ok && fetchData.url) {
        toast({
          title: "Debug Success",
          description: "Check console for full debug info. Auth URL received!",
        });
        
        // Actually open the auth URL
        window.open(fetchData.url, 'gmail_auth', 'width=600,height=700');
      } else {
        toast({
          title: "Debug Failed",
          description: `Status: ${fetchResponse.status}. Check console for details.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Debug error:', error);
      toast({
        title: "Debug Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return { connectGmail, isConnecting, debugInfo };
}