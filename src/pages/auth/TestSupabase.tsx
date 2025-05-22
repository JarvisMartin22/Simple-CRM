import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// Simple component to test Supabase API keys
export default function TestSupabase() {
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Try API key from our configuration
  const key1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw';
  
  // Raw fetch test for direct API call with our key
  const testKey1 = async () => {
    setLoading(true);
    setResults('Testing API key with direct fetch...\n');
    
    try {
      const response = await fetch('https://bujaaqjxrvntcneoarkj.supabase.co/auth/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key1,
          'X-Client-Info': 'supabase-js/2.38.4'
        },
        body: JSON.stringify({
          email: `test${Math.floor(Math.random() * 10000)}@example.com`,
          password: 'Password123!'
        })
      });
      
      const data = await response.text();
      setResults(prev => prev + `Status: ${response.status}\nResponse: ${data}\n`);
    } catch (error) {
      setResults(prev => prev + `Error: ${error.message}\n`);
    }
    
    setLoading(false);
  };
  
  // Test using the Supabase client
  const testClient = async () => {
    setLoading(true);
    setResults('Testing with Supabase client...\n');
    
    try {
      // Generate a random email to avoid conflicts
      const email = `test${Math.floor(Math.random() * 10000)}@example.com`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Password123!',
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      });
      
      if (error) {
        setResults(prev => prev + `Error: ${error.message}\n`);
        console.error('Supabase client error details:', error);
      } else {
        setResults(prev => 
          prev + `Success! User ID: ${data.user?.id || 'none'}\n` + 
          `Email: ${email}\n` +
          `Confirmation sent: ${data.user?.identities?.[0]?.identity_data?.email_verified ? 'Yes' : 'No'}\n`
        );
      }
    } catch (error) {
      setResults(prev => prev + `Exception: ${error.message}\n`);
    }
    
    setLoading(false);
  };

  // Check CORS settings
  const testCORS = async () => {
    setLoading(true);
    setResults('Testing CORS...\n');
    
    try {
      const response = await fetch('https://bujaaqjxrvntcneoarkj.supabase.co/', {
        method: 'GET'
      });
      
      const data = await response.text();
      setResults(prev => prev + `Status: ${response.status}\nResponse: ${data.substring(0, 100)}...\n`);
    } catch (error) {
      setResults(prev => prev + `Error: ${error.message}\n`);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="flex gap-4 mb-4">
        <Button 
          onClick={testKey1} 
          disabled={loading}
        >
          Test Direct Fetch
        </Button>
        
        <Button 
          onClick={testClient} 
          disabled={loading}
        >
          Test Supabase Client
        </Button>
        
        <Button 
          onClick={testCORS} 
          disabled={loading}
        >
          Test CORS
        </Button>
      </div>
      
      <div className="mt-4 bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Test Results:</h2>
        <pre className="whitespace-pre-wrap font-mono bg-black text-white p-4 rounded">
          {results || 'Click a button to run tests...'}
        </pre>
      </div>
    </div>
  );
} 