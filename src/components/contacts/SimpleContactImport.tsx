import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Upload, Users, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useGmailContactsImport, ContactPreview } from '@/hooks/useGmailContactsImport';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGmailConnect } from '@/hooks/useGmailConnect';
import { useAuth } from '@/contexts/AuthContext';
import { useEmail } from '@/contexts/EmailContext';

// Simplified version of ContactImport that just shows the UI structure without complex logic
const SimpleContactImport: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isEmailConnected, emailProvider } = useEmail();
  const [activeTab, setActiveTab] = useState("gmail");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Gmail contacts import hook
  const {
    isLoading,
    previewContacts,
    hasPreviewedContacts,
    previewGmailContacts,
    importGmailContacts,
    resetState
  } = useGmailContactsImport();
  
  // Gmail connect hook (for connecting to Gmail if not already connected)
  const { connectGmail, isConnecting } = useGmailConnect();
  
  // Update selected contacts when "Select All" changes
  useEffect(() => {
    if (selectAll) {
      const allIds = previewContacts.map(contact => contact.id);
      setSelectedContacts(new Set(allIds));
    } else if (selectedContacts.size === previewContacts.length) {
      // Only clear if we were previously "select all"
      setSelectedContacts(new Set());
    }
  }, [selectAll, previewContacts]);
  
  // Toggle selection of a contact
  const toggleContactSelection = (id: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
    
    // Update selectAll state based on if all contacts are selected
    setSelectAll(newSelected.size === previewContacts.length);
  };
  
  // Handle Gmail connect/import
  const handleGmailAction = async () => {
    // If Gmail isn't connected yet
    if (!isEmailConnected || emailProvider !== 'gmail') {
      try {
        const success = await connectGmail();
        if (success) {
          toast({
            title: "Gmail Connected",
            description: "Your Gmail account has been connected. Now you can import contacts."
          });
          // After connecting, preview contacts
          setTimeout(() => {
            previewGmailContacts();
          }, 1000);
        }
      } catch (error) {
        console.error('Error connecting to Gmail:', error);
      }
      return;
    }
    
    // If we haven't loaded contacts yet
    if (!hasPreviewedContacts) {
      previewGmailContacts();
      return;
    }
    
    // If we have previewed contacts and want to import selected ones
    if (hasPreviewedContacts && selectedContacts.size > 0) {
      const selectedContactsList = previewContacts.filter(c => selectedContacts.has(c.id));
      await importGmailContacts(selectedContactsList);
    } else if (hasPreviewedContacts) {
      toast({
        title: "No Contacts Selected",
        description: "Please select at least one contact to import."
      });
    }
  };
  
  // Render the contact list for selection
  const renderContactsList = () => {
    if (previewContacts.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No contacts found. Try adjusting your filters.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center py-2 border-b">
          <div className="w-8">
            <Checkbox 
              id="select-all" 
              checked={selectAll}
              onCheckedChange={(checked) => setSelectAll(!!checked)} 
            />
          </div>
          <Label htmlFor="select-all" className="flex-1 font-medium">Select All ({previewContacts.length})</Label>
        </div>
        
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {previewContacts.map((contact) => (
              <div key={contact.id} className="flex items-center py-2 hover:bg-gray-50 rounded px-2">
                <div className="w-8">
                  <Checkbox 
                    id={`contact-${contact.id}`} 
                    checked={selectedContacts.has(contact.id)}
                    onCheckedChange={() => toggleContactSelection(contact.id)} 
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-medium truncate">
                    {contact.first_name} {contact.last_name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">{contact.email}</div>
                </div>
                {contact.company && (
                  <div className="text-sm text-gray-500 truncate max-w-[120px]">
                    {contact.company}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
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
            {!hasPreviewedContacts ? (
              <div className="p-6 text-center">
                <Mail className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
                <h3 className="text-lg font-medium mb-2">Gmail Integration</h3>
                <p className="text-gray-500 mb-4">
                  {isEmailConnected && emailProvider === 'gmail' 
                    ? "Your Gmail account is connected. Click below to import contacts."
                    : "Connect your Gmail account to import contacts."}
                </p>
                <Button 
                  onClick={handleGmailAction}
                  disabled={isLoading || isConnecting}
                >
                  {isLoading || isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isConnecting ? "Connecting..." : "Loading Contacts..."}
                    </>
                  ) : (
                    <>
                      {isEmailConnected && emailProvider === 'gmail' ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Fetch Contacts
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Connect Gmail
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="font-medium mb-2">Contacts from Gmail</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select the contacts you want to import into your CRM.
                  </p>
                  
                  {renderContactsList()}
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        resetState();
                        setSelectedContacts(new Set());
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleGmailAction}
                      disabled={isLoading || selectedContacts.size === 0}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Import Selected ({selectedContacts.size})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
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