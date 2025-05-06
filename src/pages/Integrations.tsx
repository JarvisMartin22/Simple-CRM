
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GmailIntegration from '@/components/integrations/GmailIntegration';
import OutlookIntegration from '@/components/integrations/OutlookIntegration';
import ContactsApiIntegration from '@/components/integrations/ContactsApiIntegration';

const Integrations = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold">Integrations</h1>
        <p className="text-gray-500 mt-1">
          Connect your email accounts and manage contact integrations
        </p>
      </div>

      <Tabs defaultValue="gmail" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
          <TabsTrigger value="outlook">Outlook</TabsTrigger>
          <TabsTrigger value="contacts">Contacts API</TabsTrigger>
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
