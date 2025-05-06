
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, Users, Copy, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface ApiKey {
  id: string;
  api_key: string;
  name: string | null;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  revoked: boolean;
}

const ContactsApiIntegration = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch API key data
  const { data: apiKey, isLoading, error, refetch } = useQuery<ApiKey | null>({
    queryKey: ['api-key', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('revoked', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row Not Found"
        console.error("Error fetching API key:", error);
        throw error;
      }
      
      return data as ApiKey | null;
    },
    enabled: !!user?.id,
  });
  
  const apiEndpoints = [
    { method: 'GET', endpoint: '/api/contacts', description: 'List all contacts' },
    { method: 'GET', endpoint: '/api/contacts/:id', description: 'Get a specific contact' },
    { method: 'POST', endpoint: '/api/contacts', description: 'Create a new contact' },
    { method: 'PUT', endpoint: '/api/contacts/:id', description: 'Update a contact' },
    { method: 'DELETE', endpoint: '/api/contacts/:id', description: 'Delete a contact' }
  ];
  
  const generateApiKey = async () => {
    try {
      setIsGenerating(true);
      
      // Generate a random API key
      const keyBuffer = new Uint8Array(32);
      crypto.getRandomValues(keyBuffer);
      const apiKeyValue = Array.from(keyBuffer)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 32);
      
      // Store the API key in the database
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user?.id,
          api_key: `folk_${apiKeyValue}`,
          name: 'Default API Key'
        });
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "API access configured",
        description: "Your API key has been generated successfully.",
      });
      
      refetch();
      setIsDialogOpen(false);
      
    } catch (error) {
      console.error("Error generating API key:", error);
      
      toast({
        title: "Generation failed",
        description: "There was an error generating your API key.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const revokeApiKey = async () => {
    if (!apiKey) return;
    
    try {
      // Mark the API key as revoked
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked: true })
        .eq('id', apiKey.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "API access revoked",
        description: "Your API key has been revoked successfully.",
      });
      
      refetch();
      
    } catch (error) {
      console.error("Error revoking API key:", error);
      
      toast({
        title: "Revocation failed",
        description: "There was an error revoking your API key.",
        variant: "destructive"
      });
    }
  };
  
  const copyApiKey = () => {
    if (!apiKey) return;
    
    navigator.clipboard.writeText(apiKey.api_key);
    
    toast({
      title: "API key copied",
      description: "Your API key has been copied to clipboard.",
    });
  };
  
  const isSetup = !!apiKey && !apiKey.revoked;
  
  // If there's an error fetching the API key
  if (error) {
    toast({
      title: "Error",
      description: "There was an error fetching your API key data.",
      variant: "destructive"
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle>Contacts API</CardTitle>
            {isLoading ? (
              <Badge className="ml-2 bg-gray-300">
                <Loader2 size={12} className="mr-1 animate-spin" />
                Loading
              </Badge>
            ) : isSetup ? (
              <Badge className="ml-2 bg-green-500">
                <Check size={12} className="mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge className="ml-2 bg-gray-400">Not Configured</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="pb-4">
            Set up API access to manage contacts programmatically via REST endpoints.
          </CardDescription>
          
          {isSetup ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="font-medium">API Key</span>
                <div className="flex items-center">
                  <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono mr-2">
                    {apiKey.api_key.substring(0, 10)}...
                  </code>
                  <Button size="icon" variant="ghost" onClick={copyApiKey}>
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="font-medium">Status</span>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="font-medium">Rate Limits</span>
                <span className="text-sm text-gray-500">1000 requests per day</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              The Contacts API allows you to programmatically manage contacts in your CRM system through RESTful endpoints.
            </p>
          )}
        </CardContent>
        <CardFooter>
          {isSetup ? (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={revokeApiKey}>Revoke Access</Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button>View Documentation</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">API Documentation</h4>
                    <p className="text-sm text-gray-500">
                      View the full documentation in the developer portal.
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Open Developer Portal
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Configure API Access</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure Contacts API</DialogTitle>
                  <DialogDescription>
                    Generate an API key to access the Contacts API endpoints.
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
                          Your API key grants full access to your contacts data. Keep it secure.
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    This API key will allow you to:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-500 space-y-1">
                    <li>Create, read, update, and delete contacts</li>
                    <li>Import and export contact data</li>
                    <li>Integrate with third-party systems</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={generateApiKey} disabled={isGenerating}>
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate API Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardFooter>
      </Card>

      {isSetup && (
        <Card>
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
            <CardDescription>
              Available endpoints for the Contacts API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => (
                <div key={index} className="bg-white p-4 rounded-md border border-gray-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={endpoint.method === 'GET' ? 'bg-blue-500' : endpoint.method === 'POST' ? 'bg-green-500' : endpoint.method === 'PUT' ? 'bg-amber-500' : 'bg-red-500'}>
                      {endpoint.method}
                    </Badge>
                    <code className="font-mono text-sm">{endpoint.endpoint}</code>
                  </div>
                  <p className="text-sm text-gray-500">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline">View Sample Code</Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
};

export default ContactsApiIntegration;
