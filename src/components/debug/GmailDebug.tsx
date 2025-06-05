import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GmailIntegration {
  id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const GmailDebug: React.FC = () => {
  const { user } = useAuth();
  const [integration, setIntegration] = useState<GmailIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  const checkIntegration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check environment variables
      const env = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'undefined',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'undefined',
        VITE_SUPABASE_FUNCTIONS_URL: import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'undefined',
      };
      setEnvVars(env);

      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Check Gmail integration
      const { data, error: integrationError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('provider', 'gmail')
        .maybeSingle();

      if (integrationError) {
        setError(`Integration query error: ${integrationError.message}`);
        return;
      }

      setIntegration(data);
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testGmailEndpoint = async () => {
    if (!integration) {
      setError('No Gmail integration found');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/gmail-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'X-Gmail-Token': integration.access_token,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          integration_id: integration.id,
          access_token: integration.access_token,
          refresh_token: integration.refresh_token,
          include_no_email: true
        })
      });

      const result = await response.text();
      console.log('Test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: result
      });

      if (!response.ok) {
        setError(`Test failed: ${response.status} ${response.statusText} - ${result}`);
      } else {
        setError(`Test successful: ${response.status} - ${result.substring(0, 200)}...`);
      }
    } catch (err) {
      setError(`Test error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const isTokenExpired = () => {
    if (!integration?.expires_at) return null;
    const expiry = new Date(integration.expires_at);
    const now = new Date();
    return now > expiry;
  };

  useEffect(() => {
    checkIntegration();
  }, [user]);

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (!integration) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Gmail Integration Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Status */}
        <div>
          <h3 className="font-semibold mb-2">User Authentication</h3>
          <Badge variant={user ? "default" : "destructive"}>
            {user ? `Authenticated: ${user.email}` : 'Not authenticated'}
          </Badge>
        </div>

        {/* Environment Variables */}
        <div>
          <h3 className="font-semibold mb-2">Environment Variables</h3>
          <div className="space-y-1">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="font-mono">{key}:</span>
                <Badge variant={value === 'undefined' ? "destructive" : "default"}>
                  {value}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Gmail Integration Status */}
        <div>
          <h3 className="font-semibold mb-2">Gmail Integration</h3>
          {integration ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Integration ID:</div>
                <div className="font-mono">{integration.id}</div>
                
                <div>Has Access Token:</div>
                <Badge variant={integration.access_token ? "default" : "destructive"}>
                  {integration.access_token ? 'Yes' : 'No'}
                </Badge>
                
                <div>Has Refresh Token:</div>
                <Badge variant={integration.refresh_token ? "default" : "destructive"}>
                  {integration.refresh_token ? 'Yes' : 'No'}
                </Badge>
                
                <div>Token Expires:</div>
                <div className="font-mono text-xs">
                  {integration.expires_at || 'Unknown'}
                </div>
                
                <div>Token Status:</div>
                <Badge variant={isTokenExpired() === null ? "secondary" : isTokenExpired() ? "destructive" : "default"}>
                  {isTokenExpired() === null ? 'Unknown' : isTokenExpired() ? 'Expired' : 'Valid'}
                </Badge>
                
                <div>Created:</div>
                <div className="font-mono text-xs">
                  {new Date(integration.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <Badge variant="destructive">No Gmail integration found</Badge>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div>
            <h3 className="font-semibold mb-2">Error Details</h3>
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={checkIntegration} disabled={loading} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          
          {integration && (
            <Button onClick={testGmailEndpoint} variant="outline" size="sm">
              Test Gmail Endpoint
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 