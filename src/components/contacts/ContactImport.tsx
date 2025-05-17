import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Upload, Users, Filter, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ContactImport: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gmail");
  const [filterOptions, setFilterOptions] = useState({
    onlyWithName: true,
    excludeNoReply: true,
    lastContactedDays: "180" // Last 6 months
  });
  
  // Placeholder Gmail connection handler
  const handleConnectGmail = () => {
    toast({
      title: "Gmail Connection",
      description: "This functionality is currently disabled."
    });
  };
  
  // Placeholder fetch contacts handler
  const fetchGmailContacts = () => {
    toast({
      title: "Fetching Contacts",
      description: "This functionality is currently disabled."
    });
  };
  
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
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-medium mb-2 flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Options
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="onlyWithName" 
                      checked={filterOptions.onlyWithName} 
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, onlyWithName: checked === true }))
                      }
                    />
                    <Label htmlFor="onlyWithName">Only contacts with names</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="excludeNoReply" 
                      checked={filterOptions.excludeNoReply} 
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, excludeNoReply: checked === true }))
                      }
                    />
                    <Label htmlFor="excludeNoReply">Exclude no-reply and system emails</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastContactedDays">Show contacts from the last:</Label>
                    <Select 
                      value={filterOptions.lastContactedDays} 
                      onValueChange={(value) => 
                        setFilterOptions(prev => ({ ...prev, lastContactedDays: value }))
                      }
                    >
                      <SelectTrigger id="lastContactedDays" className="w-full">
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 3 months</SelectItem>
                        <SelectItem value="180">Last 6 months</SelectItem>
                        <SelectItem value="365">Last year</SelectItem>
                        <SelectItem value="">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={fetchGmailContacts} 
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Fetch Contacts
                    </Button>
                  </div>
                </div>
              </div>
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

export default ContactImport;
