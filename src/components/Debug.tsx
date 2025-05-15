import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useEmail } from '@/contexts/EmailContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';

export function DebugPanel() {
  const { user } = useAuth();
  const { isEmailConnected, emailProvider, emailAddress } = useEmail();
  const { toast } = useToast();
  const [showDebug, setShowDebug] = React.useState(false);
  const [dbCheck, setDbCheck] = React.useState<any>(null);
  const [localStorageIntegration, setLocalStorageIntegration] = React.useState<any>(null);
  
  // Check localStorage on mount
  useEffect(() => {
    if (showDebug) {
      try {
        const storedData = localStorage.getItem('gmail_integration');
        if (storedData) {
          setLocalStorageIntegration(JSON.parse(storedData));
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }
    }
  }, [showDebug]);
  
  // Direct query to check integration in the database
  const { data: directIntegration, isLoading, refetch } = useQuery({
    queryKey: ['debug-integration', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'gmail')
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // This is normal - just means no integration found
            console.log("Debug: No integration found (PGRST116)");
            return null;
          } else {
            console.error("Debug: Error fetching integration:", error);
            throw error;
          }
        }
        
        return data;
      } catch (e) {
        console.error("Debug query error:", e);
        return null;
      }
    },
    enabled: !!user?.id && showDebug,
  });
  
  // Simple check for tables
  const checkDatabase = async () => {
    try {
      // Get the list of tables using a direct SQL query
      const { data, error } = await supabase
        .from('user_integrations')
        .select('count(*)', { count: 'exact' });
        
      setDbCheck({
        integrations: {
          exists: !error,
          error: error ? error.message : null,
          count: data?.length || 0
        }
      });
      
      toast({
        title: "Database Check Complete",
        description: "See the debug panel for results",
      });
    } catch (e) {
      console.error("Database check error:", e);
      toast({
        title: "Database Check Failed",
        description: e.message,
        variant: "destructive"
      });
    }
  };
  
  // Refresh localStorage data
  const refreshLocalStorage = () => {
    try {
      const storedData = localStorage.getItem('gmail_integration');
      if (storedData) {
        setLocalStorageIntegration(JSON.parse(storedData));
        toast({
          title: "LocalStorage Data Refreshed",
          description: "Updated integration data from localStorage",
        });
      } else {
        setLocalStorageIntegration(null);
        toast({
          title: "No LocalStorage Data",
          description: "No gmail_integration data found in localStorage",
        });
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
      toast({
        title: "LocalStorage Error",
        description: e.message,
        variant: "destructive"
      });
    }
  };
  
  // Function to manually reload the page
  const reloadPage = () => {
    toast({
      title: "Reloading page",
      description: "Refreshing application state...",
    });
    
    // Reload after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowDebug(true)}
        >
          Show Debug
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex justify-between">
            <span>Debug Information</span>
            <Button
              size="sm" 
              variant="ghost"
              onClick={() => setShowDebug(false)}
            >
              Hide
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>
            <p><strong>Context API State:</strong></p>
            <p>Email Connected: {isEmailConnected ? 'YES' : 'NO'}</p>
            <p>Provider: {emailProvider || 'None'}</p>
            <p>Email: {emailAddress || 'None'}</p>
          </div>
          
          <div>
            <p><strong>Direct DB Query:</strong> {isLoading ? 'Loading...' : ''}</p>
            {directIntegration ? (
              <div className="bg-green-50 p-2 rounded text-green-800">
                <p>Found integration in database</p>
                <p>Email: {directIntegration.email}</p>
                <p>Created: {new Date(directIntegration.created_at).toLocaleString()}</p>
              </div>
            ) : (
              <div className="bg-amber-50 p-2 rounded text-amber-800">
                <p>No integration found with direct query</p>
              </div>
            )}
          </div>
          
          {localStorageIntegration && (
            <div>
              <p><strong>LocalStorage Integration:</strong></p>
              <div className="bg-blue-50 p-2 rounded text-blue-800">
                <p>Email: {localStorageIntegration.email}</p>
                <p>Created: {new Date(localStorageIntegration.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
          
          {dbCheck && (
             <div>
               <p><strong>Database Tables Check:</strong></p>
               <div className={`p-2 rounded ${dbCheck.integrations.exists ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                 <p>user_integrations: {dbCheck.integrations.exists ? 'EXISTS' : 'MISSING'}</p>
                 {dbCheck.integrations.error && <p>Error: {dbCheck.integrations.error}</p>}
                 {dbCheck.integrations.exists && <p>Count: {dbCheck.integrations.count}</p>}
               </div>
             </div>
          )}
          
          <div className="flex space-x-2 pt-2">
            <Button size="sm" onClick={checkDatabase}>Check DB</Button>
            <Button size="sm" onClick={refreshLocalStorage}>Check LocalStorage</Button>
            <Button size="sm" onClick={() => refetch()}>Refresh</Button>
            <Button size="sm" onClick={reloadPage}>Reload</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 