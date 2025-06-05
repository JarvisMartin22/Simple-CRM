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
import { ContactReview } from './ContactReview';
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
    fetchContacts,
    importSelectedContacts,
    isFetching,
    isImporting,
    importProgress,
    includeNoEmail,
    setIncludeNoEmail,
    contacts,
    selectedContacts,
    showReview,
    toggleContact,
    toggleAllContacts,
    cancelReview,
    stats
  } = useGmailContactsImport();

  if (showReview) {
    return (
      <ContactReview 
        contacts={contacts}
        selectedContacts={selectedContacts}
        onSelectionChange={toggleContact}
        onSelectAll={toggleAllContacts}
        onImport={importSelectedContacts}
        onCancel={cancelReview}
        isImporting={isImporting}
        importProgress={importProgress}
        stats={stats}
      />
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="gmail">Gmail</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gmail">
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Enhanced Company Detection:</strong> Gmail import now automatically detects and creates companies from email domains using intelligent analysis.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                <h3 className="font-normal mb-4 flex items-center justify-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Import Settings
                </h3>
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-no-email"
                      checked={includeNoEmail}
                      onCheckedChange={(checked) => setIncludeNoEmail(checked as boolean)}
                    />
                    <label
                      htmlFor="include-no-email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Include contacts without email addresses
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="only-with-name"
                      checked={filterOptions.onlyWithName}
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, onlyWithName: checked as boolean }))
                      }
                    />
                    <label
                      htmlFor="only-with-name"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Only import contacts with names
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exclude-no-reply"
                      checked={filterOptions.excludeNoReply}
                      onCheckedChange={(checked) => 
                        setFilterOptions(prev => ({ ...prev, excludeNoReply: checked as boolean }))
                      }
                    />
                    <label
                      htmlFor="exclude-no-reply"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Exclude no-reply and automated emails
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={fetchContacts}
                      className="w-full"
                      disabled={isFetching}
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Fetching Contacts...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Fetch from Gmail
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
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Enhanced Company Detection:</strong> CSV import now automatically detects and creates companies from email domains using intelligent analysis.
              </p>
            </div>
            <CsvImport onClose={onClose} />
          </TabsContent>
          
          <TabsContent value="manual">
            <div className="p-6 bg-gray-50 border rounded-md text-center max-w-md mx-auto">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="font-normal mb-2">Manual Entry</h3>
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
