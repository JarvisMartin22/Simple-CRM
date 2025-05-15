import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useGmailConnect } from "@/hooks/useGmailConnect";
import { useGmailDisconnect } from "@/hooks/useGmailDisconnect";
import { ConfirmDisconnect } from "./ConfirmDisconnect";

interface Integration {
  id: string;
  provider: string;
  email: string;
  access_token: string;
  created_at: string;
  refresh_token: string | null;
  expires_at: string | null;
}

interface EmailStats {
  sent: number;
  opened: number;
  replied: number;
}

const GmailIntegration = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { connectGmail, isConnecting, resetConnectionState } = useGmailConnect();
  const { disconnectGmail, isDisconnecting } = useGmailDisconnect();
  const [localStorageIntegration, setLocalStorageIntegration] = useState<Integration | null>(null);
  
  // Check localStorage for integration data
  useEffect(() => {
    if (user?.id) {
      try {
        const storedData = localStorage.getItem('gmail_integration');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData.user_id === user.id) {
            setLocalStorageIntegration(parsedData as Integration);
            console.log('GmailIntegration: Found integration data in localStorage');
          }
        }
      } catch (e) {
        console.error("GmailIntegration: Error reading from localStorage:", e);
      }
    }
  }, [user?.id]);
  
  // Handle connection timeout
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (isConnecting) {
      console.log('GmailIntegration: Connection started, setting timeout');
      // If connecting takes more than 2 minutes, reset the state
      timeoutId = window.setTimeout(() => {
        console.log('GmailIntegration: Connection timeout - resetting state');
        resetConnectionState();
        toast({
          title: "Connection timeout",
          description: "The connection attempt took too long. Please try again.",
          variant: "destructive"
        });
      }, 2 * 60 * 1000);
    }
    
    return () => {
      if (timeoutId) {
        console.log('GmailIntegration: Clearing timeout');
        window.clearTimeout(timeoutId);
      }
    };
  }, [isConnecting, resetConnectionState, toast]);
  
  // Fetch integration data
  const { data: dbIntegration, isLoading, error, refetch } = useQuery<Integration | null>({
    queryKey: ['gmail-integration', user?.id],
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
            // No integration found, this is expected for new users
            console.log("GmailIntegration: No integration found (PGRST116)");
            return null;
          } else if ((error as any).status === 406) {
            // 406 Not Acceptable error - likely header issue
            console.error("GmailIntegration: 406 error fetching integration:", error);
            // Return null instead of throwing to prevent app crash
            return null;
          } else {
            console.error("GmailIntegration: Error fetching integration:", error);
            throw error;
          }
        }
        
        return data as Integration | null;
      } catch (e) {
        console.error("GmailIntegration: Unexpected error:", e);
        // Return null to prevent app from crashing on unexpected errors
        return null;
      }
    },
    enabled: !!user?.id,
  });
  
  // Get effective integration (prioritize database, fallback to localStorage)
  const integration = dbIntegration || localStorageIntegration;
  
  // Fetch email stats if connected
  const { data: emailStats } = useQuery<EmailStats>({
    queryKey: ['gmail-stats', integration?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_tracking')
        .select('id, opened_at, replied_at')
        .eq('user_id', user?.id)
        .eq('provider', 'gmail');
        
      if (error) {
        console.error("Error fetching email stats:", error);
        throw error;
      }
      
      return {
        sent: data.length,
        opened: data.filter(email => email.opened_at).length,
        replied: data.filter(email => email.replied_at).length
      };
    },
    enabled: !!integration?.id,
    initialData: { sent: 24, opened: 18, replied: 7 } // Default data until real data is fetched
  });
  
  const handleConnect = async () => {
    console.log('GmailIntegration: initiating connection');
    try {
      const success = await connectGmail();
      console.log('GmailIntegration: connection result:', success);
      if (success) {
        setIsDialogOpen(false);
        await refetch();
        // Check localStorage too
        const storedData = localStorage.getItem('gmail_integration');
        if (storedData) {
          setLocalStorageIntegration(JSON.parse(storedData) as Integration);
        }
      }
    } catch (error) {
      console.error('GmailIntegration: connection error:', error);
    }
  };
  
  const handleDisconnect = async () => {
    if (!integration) return;
    console.log('GmailIntegration: disconnecting');
    try {
      // If we have a DB integration, disconnect it
      if (dbIntegration?.id) {
        await disconnectGmail(dbIntegration.id);
      }
      
      // Also remove from localStorage if present
      if (localStorageIntegration) {
        localStorage.removeItem('gmail_integration');
        setLocalStorageIntegration(null);
      }
      
      await refetch();
    } catch (error) {
      console.error('GmailIntegration: disconnection error:', error);
    }
  };
  
  const isConnected = !!integration;
  
  // If there's an error fetching the integration
  if (error) {
    toast({
      title: "Error",
      description: "There was an error fetching your integration data.",
      variant: "destructive"
    });
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gmail</CardTitle>
            <CardDescription>
              Send emails and import contacts from Gmail
            </CardDescription>
          </div>
          {isConnected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
              <Check className="w-3 h-3 mr-1" /> Connected
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <>
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <div className="flex items-center">
                <Mail className="text-gray-500 mr-2 h-5 w-5" />
                <div>
                  <div className="font-medium">{integration.email}</div>
                  <div className="text-gray-500 text-sm">
                    Connected {new Date(integration.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <div className="text-blue-600 font-medium text-xl">{emailStats.sent}</div>
                <div className="text-gray-500 text-sm">Emails Sent</div>
              </div>
              <div className="bg-green-50 p-3 rounded-md text-center">
                <div className="text-green-600 font-medium text-xl">{emailStats.opened}</div>
                <div className="text-gray-500 text-sm">Opened</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-md text-center">
                <div className="text-purple-600 font-medium text-xl">{emailStats.replied}</div>
                <div className="text-gray-500 text-sm">Replies</div>
              </div>
            </div>
            
            {isDisconnecting ? (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </Button>
            ) : (
              <ConfirmDisconnect 
                onConfirm={handleDisconnect}
                isDisconnecting={isDisconnecting}
                serviceName="Gmail"
              >
                <Button variant="outline" className="w-full text-gray-600 border-gray-300">
                  Disconnect Gmail
                </Button>
              </ConfirmDisconnect>
            )}
          </>
        ) : (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start mb-4">
              <AlertCircle className="text-yellow-600 mr-2 h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  Connect your Gmail account to enable email tracking, sending, and contact import features.
                </p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  Connect Gmail
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Gmail</DialogTitle>
                  <DialogDescription>
                    Connect your Gmail account to import contacts and send emails directly from the CRM.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-gray-50 p-4 rounded-md text-sm">
                    <p className="font-medium mb-2">What permissions will be requested:</p>
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                      <li>Read your Gmail contacts</li>
                      <li>Send emails on your behalf</li>
                      <li>View your email address</li>
                      <li>View your basic profile info</li>
                    </ul>
                    <p className="mt-4 text-xs text-gray-500">
                      We only use these permissions to provide the features you request. 
                      Your data is never shared with third parties.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isConnecting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect Gmail"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GmailIntegration;
