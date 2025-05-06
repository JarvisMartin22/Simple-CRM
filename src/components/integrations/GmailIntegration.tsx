
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

interface Integration {
  id: string;
  provider: string;
  email: string;
  access_token: string;
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
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch integration data
  const { data: integration, isLoading, error, refetch } = useQuery<Integration | null>({
    queryKey: ['gmail-integration', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row Not Found"
        console.error("Error fetching integration:", error);
        throw error;
      }
      
      return data as Integration | null;
    },
    enabled: !!user?.id,
  });
  
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
    try {
      setIsConnecting(true);
      
      // Call the Gmail auth Edge Function to get OAuth URL
      const response = await supabase.functions.invoke('gmail-auth');
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Open OAuth URL in a popup window
      const authUrl = response.data.url;
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please enable popups for this site.');
      }
      
      // Poll for popup closure or redirect
      const pollTimer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            setIsConnecting(false);
            return;
          }
          
          const currentUrl = popup.location.href;
          
          if (currentUrl.includes('code=')) {
            clearInterval(pollTimer);
            popup.close();
            
            // Extract code from URL
            const url = new URL(currentUrl);
            const code = url.searchParams.get('code');
            
            if (code) {
              // Call Gmail auth endpoint with the code
              const tokenResponse = await supabase.functions.invoke('gmail-auth', {
                body: { code }
              });
              
              if (tokenResponse.error) {
                throw new Error(tokenResponse.error);
              }
              
              // Save integration data to database
              const { error: integrationError } = await supabase
                .from('user_integrations')
                .upsert({
                  user_id: user?.id,
                  ...tokenResponse.data
                });
                
              if (integrationError) {
                throw integrationError;
              }
              
              toast({
                title: "Gmail connected successfully",
                description: `Connected as ${tokenResponse.data.email}`,
              });
              
              refetch();
              setIsDialogOpen(false);
            }
          }
        } catch (e) {
          console.error("Error in OAuth flow:", e);
          clearInterval(pollTimer);
          setIsConnecting(false);
          
          toast({
            title: "Connection failed",
            description: "There was an error connecting to Gmail.",
            variant: "destructive"
          });
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error initiating OAuth flow:", error);
      setIsConnecting(false);
      
      toast({
        title: "Connection failed",
        description: "There was an error connecting to Gmail.",
        variant: "destructive"
      });
    }
  };
  
  const handleDisconnect = async () => {
    if (!integration) return;
    
    try {
      // Delete the integration from the database
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integration.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Gmail disconnected",
        description: "Your Gmail account has been disconnected from the CRM.",
      });
      
      refetch();
      
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
      
      toast({
        title: "Disconnection failed",
        description: "There was an error disconnecting from Gmail.",
        variant: "destructive"
      });
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-red-500" />
            <CardTitle>Gmail Integration</CardTitle>
            {isLoading ? (
              <Badge className="ml-2 bg-gray-300">
                <Loader2 size={12} className="mr-1 animate-spin" />
                Loading
              </Badge>
            ) : isConnected ? (
              <Badge className="ml-2 bg-green-500">
                <Check size={12} className="mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="ml-2 bg-gray-400">Not Connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="pb-4">
            Connect your Gmail account to sync emails and contacts with the CRM.
          </CardDescription>
          
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="font-medium">Account</span>
                <span className="text-sm text-gray-500">{integration.email}</span>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="font-medium">Sync Status</span>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-500">Syncing</Badge>
                  <span className="text-sm text-gray-500">Last synced 5 minutes ago</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="font-medium">Email Tracking</span>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Connecting Gmail allows you to track emails, sync contacts, and automate workflows based on email interactions.
            </p>
          )}
        </CardContent>
        <CardFooter>
          {isConnected ? (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
              <Button>Configure Settings</Button>
            </div>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Connect Gmail</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect to Gmail</DialogTitle>
                  <DialogDescription>
                    This will allow the CRM to access your Gmail account to sync emails and contacts.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="rounded-md bg-amber-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-800">
                          You will be redirected to Google to authorize this application.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    The CRM requires the following permissions:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-500 space-y-1">
                    <li>Read and send emails</li>
                    <li>Access contact information</li>
                    <li>Manage labels and folders</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue with Google
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardFooter>
      </Card>

      {isConnected && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Email Tracking</CardTitle>
              <CardDescription>
                Configure how email tracking works with your Gmail account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-md border border-gray-100 text-center">
                    <div className="text-2xl font-semibold">{emailStats.sent}</div>
                    <div className="text-gray-500 text-sm">Emails Sent</div>
                  </div>
                  <div className="bg-white p-4 rounded-md border border-gray-100 text-center">
                    <div className="text-2xl font-semibold">{emailStats.opened}</div>
                    <div className="text-gray-500 text-sm">Opens</div>
                  </div>
                  <div className="bg-white p-4 rounded-md border border-gray-100 text-center">
                    <div className="text-2xl font-semibold">{emailStats.replied}</div>
                    <div className="text-gray-500 text-sm">Replies</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Automation</CardTitle>
              <CardDescription>
                Set up automated workflows based on email interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <h3 className="font-medium mb-2">On Email Open</h3>
                  <p className="text-sm text-gray-500">
                    When a contact opens an email, create a follow-up task
                  </p>
                </div>
                <div className="bg-white p-4 rounded-md border border-gray-100">
                  <h3 className="font-medium mb-2">On Email Reply</h3>
                  <p className="text-sm text-gray-500">
                    When a contact replies to an email, move to next pipeline stage
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Add New Workflow</Button>
            </CardFooter>
          </Card>
        </>
      )}
    </>
  );
};

export default GmailIntegration;
