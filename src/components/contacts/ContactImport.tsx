import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Upload, Users, Filter, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGmailContactsImport } from '@/hooks/useGmailContactsImport';
import CsvImport from './CsvImport';
import { Progress } from "@/components/ui/progress";

export interface ContactImportProps {
  onClose: () => void;
}

const ContactImport: React.FC<ContactImportProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("gmail");
  const [filterOptions, setFilterOptions] = useState({
    onlyWithName: true,
    excludeNoReply: true,
    lastContactedDays: "180" // Last 6 months
  });

  const { 
    importFromGmail, 
    isImporting, 
    importProgress,
    includeNoEmail,
    setIncludeNoEmail
  } = useGmailContactsImport();

  const handleImport = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to import contacts.",
        variant: "destructive"
      });
      return;
    }

    try {
      await importFromGmail();
      if (importProgress.successful > 0) {
        onClose();
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
      toast({
        title: "Import Failed",
        description: "There was an error importing your contacts. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
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
                      id="includeNoEmail" 
                      checked={includeNoEmail} 
                      onCheckedChange={(checked) => setIncludeNoEmail(checked === true)}
                    />
                    <Label htmlFor="includeNoEmail">Exclude contacts without email addresses</Label>
                  </div>

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
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Importing contacts...</span>
                        <span>{importProgress.processed} / {importProgress.total}</span>
                      </div>
                      <Progress value={(importProgress.processed / importProgress.total) * 100} />
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Button 
                      onClick={handleImport}
                      className="w-full"
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Import from Gmail
                        </>
                      )}
                    </Button>
                  </div>

                  {!user && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
                      <AlertCircle className="text-yellow-600 mr-2 h-5 w-5 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Please log in to import contacts from Gmail
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="csv">
            <CsvImport onClose={onClose} />
          </TabsContent>
          
          <TabsContent value="manual">
            <div className="p-4 bg-gray-50 border rounded-md text-center">
              <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <h3 className="font-medium mb-1">Manual Entry</h3>
              <p className="text-gray-500 text-sm mb-4">
                Add contacts one by one with detailed information
              </p>
              <Button variant="outline" onClick={onClose}>
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
