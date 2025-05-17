import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Upload, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Simplified version of ContactImport that just shows the UI structure without complex logic
const SimpleContactImport: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gmail");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Contacts</CardTitle>
        <CardDescription>
          Import your contacts from various sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="gmail">Gmail</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gmail">
            <div className="p-6 text-center">
              <Mail className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
              <h3 className="text-lg font-medium mb-2">Gmail Integration</h3>
              <p className="text-gray-500 mb-4">
                Connect your Gmail account to import contacts.
              </p>
              <Button onClick={() => toast({ title: "Gmail button clicked" })}>
                Connect Gmail
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="csv">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">Upload CSV File</h3>
              <p className="text-gray-500 text-sm mb-4 text-center">
                Drag and drop a CSV file here, or click to browse
              </p>
              <Button variant="outline">
                Browse Files
              </Button>
              <p className="text-xs text-gray-400 mt-4">
                CSV should include columns for name, email, company, etc.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="manual">
            <div className="p-4 bg-gray-50 border rounded-md text-center">
              <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <h3 className="font-medium mb-1">Manual Entry</h3>
              <p className="text-gray-500 text-sm mb-4">
                Add contacts one by one with detailed information
              </p>
              <Button variant="outline">
                Add New Contact
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SimpleContactImport; 