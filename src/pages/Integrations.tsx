
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import GmailIntegration from '@/components/integrations/GmailIntegration';
import OutlookIntegration from '@/components/integrations/OutlookIntegration';
import ContactsApiIntegration from '@/components/integrations/ContactsApiIntegration';
import { DebugPanel } from '@/components/Debug';

const Integrations = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("gmail");

  // Fetch all integrations to show active states in tabs
  const { data: integrations } = useQuery({
    queryKey: ['integrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_integrations')
        .select('provider, email')
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error fetching integrations:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Check which integrations are active
  const hasGmail = integrations?.some(i => i.provider === 'gmail');
  const hasOutlook = integrations?.some(i => i.provider === 'outlook');

  // Fetch API key to check if Contacts API is configured
  const { data: apiKey } = useQuery({
    queryKey: ['active-api-key', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('revoked', false)
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching API key:", error);
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold">Integrations</h1>
        <p className="text-gray-500 mt-1">
          Connect your email accounts and manage contact integrations
        </p>
      </div>
      <DebugPanel />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="gmail" className="flex items-center">
            Gmail
            {hasGmail && (
              <Badge variant="outline" className="ml-2 bg-green-500 text-white border-0 p-1">
                <Check className="h-3 w-3" />
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outlook" className="flex items-center">
            Outlook
            {hasOutlook && (
              <Badge variant="outline" className="ml-2 bg-green-500 text-white border-0 p-1">
                <Check className="h-3 w-3" />
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center">
            Contacts API
            {apiKey && (
              <Badge variant="outline" className="ml-2 bg-green-500 text-white border-0 p-1">
                <Check className="h-3 w-3" />
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="gmail" className="space-y-4">
          <GmailIntegration />
        </TabsContent>
        
        <TabsContent value="outlook" className="space-y-4">
          <OutlookIntegration />
        </TabsContent>
        
        <TabsContent value="contacts" className="space-y-4">
          <ContactsApiIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Integrations;
