import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useContacts } from '@/contexts/ContactsContext';

export interface ContactPreview {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  company: string | null;
  title: string | null;
  phone: string | null;
  website: string | null;
  photo_url: string | null;
  external_id: string;
  category?: 'contacts' | 'otherContacts' | 'frequent';
}

export type ContactCategory = 'contacts' | 'otherContacts' | 'frequent';

export function useGmailContactsImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addContact } = useContacts();
  const [isLoading, setIsLoading] = useState(false);
  const [previewContacts, setPreviewContacts] = useState<ContactPreview[]>([]);
  const [hasPreviewedContacts, setHasPreviewedContacts] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ContactCategory[]>(['contacts']);
  
  // Fetch Gmail integration status
  const fetchGmailIntegration = async () => {
    if (!user?.id) return null;
    
    try {
      console.log("Fetching Gmail integration for user:", user.id);
      const { data, error } = await supabase
        .from('user_integrations')
        .select('id, email, access_token')
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .single();
        
      if (error) {
        console.error("Error fetching Gmail integration:", error);
        return null;
      }
      
      console.log("Gmail integration found:", data ? "Yes" : "No");
      return data;
    } catch (error) {
      console.error("Error in fetchGmailIntegration:", error);
      return null;
    }
  };
  
  // Preview contacts from Gmail
  const previewGmailContacts = async (categories: ContactCategory[] = selectedCategories) => {
    setIsLoading(true);
    console.log(`Starting Gmail contacts preview for categories: ${categories.join(', ')}`);
    
    if (categories.length === 0) {
      toast({
        title: "No Categories Selected",
        description: "Please select at least one contact category to import.",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
    
    try {
      // Check if Gmail is connected
      const integration = await fetchGmailIntegration();
      
      if (!integration) {
        toast({
          title: "Gmail Not Connected",
          description: "Please connect your Gmail account first in the Integrations section.",
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }
      
      // Get the user's session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      console.log("Calling custom contacts fetch for categories:", categories);
      
      // We'll use our own approach to fetch contacts from different resources
      let allContacts: ContactPreview[] = [];
      
      try {
        // For each selected category, we'll fetch contacts directly using the Gmail API
        for (const category of categories) {
          console.log(`Fetching contacts for category: ${category}`);
          
          // Call the gmail-contacts-preview edge function directly with CORS headers
          const response = await fetch(`https://bujaaqjxrvntcneoarkj.supabase.co/functions/v1/gmail-contacts-preview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw',
            },
            body: JSON.stringify({ 
              userId: user?.id,
              filters: {
                excludeNoReply: true,
                onlyWithName: true,
                categories: [category], // Send just one category at a time to ensure we get correct category data
                resourceName: category === 'contacts' ? 'connections' : 
                             category === 'otherContacts' ? 'otherContacts' : 
                             'contactGroups/frequentlyContacted/members'
              }
            })
          });
          
          console.log(`Edge function response status for ${category}:`, response.status);
          
          if (!response.ok) {
            const errorData = await response.text();
            console.error(`Error response from edge function for ${category} (${response.status} ${response.statusText}):`, errorData);
            continue;
          }
          
          const data = await response.json();
          console.log(`Edge function response for ${category}:`, data);
          
          if (data && data.contacts && data.contacts.length > 0) {
            console.log(`Found ${data.contacts.length} contacts for category ${category}`);
            
            // Mark each contact with its category
            const categorizedContacts = data.contacts.map(contact => ({
              ...contact,
              category
            }));
            
            // Add these contacts to our running list
            allContacts = [...allContacts, ...categorizedContacts];
          } else {
            console.log(`No contacts found for category ${category}`);
          }
        }
        
        // If we got contacts from at least one category
        if (allContacts.length > 0) {
          console.log(`Total contacts from all categories: ${allContacts.length}`);
          
          // Filter out contacts without emails
          const validContacts = allContacts.filter(contact => contact.email);
          
          if (validContacts.length < allContacts.length) {
            console.log(`Filtered out ${allContacts.length - validContacts.length} contacts without email addresses`);
          }
          
          // Remove duplicates (same email in different categories)
          const emailMap = new Map<string, ContactPreview>();
          validContacts.forEach(contact => {
            if (contact.email && !emailMap.has(contact.email.toLowerCase())) {
              emailMap.set(contact.email.toLowerCase(), contact);
            }
          });
          
          const uniqueContacts = Array.from(emailMap.values());
          console.log(`After removing duplicates: ${uniqueContacts.length} unique contacts`);
          
          setPreviewContacts(uniqueContacts);
          setHasPreviewedContacts(true);
          
          toast({
            title: "Contacts Retrieved",
            description: `Found ${uniqueContacts.length} contacts from selected categories`
          });
          
          return true;
        } else {
          console.log("No contacts found in any selected category");
          toast({
            title: "No Contacts Found",
            description: "We couldn't find any contacts in the selected categories."
          });
          
          return false;
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error previewing Gmail contacts:", error);
      
      toast({
        title: "Error Fetching Contacts",
        description: error.message || "There was a problem retrieving your Gmail contacts.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Import contacts from Gmail
  const importGmailContacts = async (selectedContacts: ContactPreview[] = previewContacts) => {
    if (!user?.id || selectedContacts.length === 0) {
      toast({
        title: "No Contacts Selected",
        description: "Please select contacts to import.",
        variant: "destructive"
      });
      return false;
    }
    
    setIsLoading(true);
    console.log(`Starting import of ${selectedContacts.length} contacts`);
    
    try {
      // Prepare contacts for import
      const allContacts = selectedContacts;
      const validContacts = selectedContacts.filter(contact => contact.email);
      const invalidContacts = selectedContacts.filter(contact => !contact.email);
      
      if (invalidContacts.length > 0) {
        console.log(`Filtering out ${invalidContacts.length} contacts without email addresses:`, 
          invalidContacts.map(c => `${c.first_name} ${c.last_name}`));
      }
      
      const contactsToImport = validContacts.map(contact => ({
        id: contact.id,
        first_name: contact.first_name || "Unknown",
        last_name: contact.last_name || "",
        email: contact.email,
        company: contact.company,
        title: contact.title,
        phone: contact.phone,
        website: contact.website,
        domain: contact.email && contact.email.includes('@') ? contact.email.split('@')[1] : null,
        tags: ['gmail-import', contact.category || 'contacts']
      }));
      
      if (contactsToImport.length === 0) {
        toast({
          title: "No Valid Contacts",
          description: "The selected contacts don't have email addresses, which are required.",
          variant: "destructive"
        });
        setIsLoading(false);
        return false;
      }
      
      console.log("Prepared contacts for import:", contactsToImport.length);
      console.log("Contact details:", JSON.stringify(contactsToImport, null, 2));
      
      // Get the user's session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      console.log("Calling import-contacts edge function");
      
      // Add a test mode querystring parameter to debug without actual DB insertion
      const testMode = false; // Set to false for actual imports, true for testing
      
      // If in test mode, modify one contact for a specific test case
      if (testMode && contactsToImport.length > 0) {
        // Take the first contact and modify it to ensure it has all required fields
        const testContact = {
          ...contactsToImport[0],
          email: `test${Math.floor(Math.random() * 10000)}@example.com`, // Random email to avoid duplicates
          first_name: contactsToImport[0].first_name || "Test",
          last_name: contactsToImport[0].last_name || "User",
          tags: ["gmail-import", "test"]
        };
        
        console.log("Created test contact:", JSON.stringify(testContact, null, 2));
        contactsToImport[0] = testContact;
      }
      
      const endpoint = testMode ? 
        `https://bujaaqjxrvntcneoarkj.supabase.co/functions/v1/import-contacts?testMode=true` :
        `https://bujaaqjxrvntcneoarkj.supabase.co/functions/v1/import-contacts`;
      
      // Call the import-contacts edge function directly with CORS headers
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw',
        },
        body: JSON.stringify({ 
          userId: user.id,
          contacts: contactsToImport,
          source: 'gmail'
        })
      });
      
      console.log("Edge function response status:", response.status);
      
      // Get the raw response text first for better debugging
      const responseText = await response.text();
      console.log("Raw response text:", responseText);
      
      let data;
      try {
        // Then parse it as JSON
        data = JSON.parse(responseText);
        console.log("Import response:", data);
      } catch (parseError) {
        console.error("Error parsing response as JSON:", parseError);
        throw new Error(`Failed to parse response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        console.error(`Error response from edge function (${response.status} ${response.statusText}):`, data);
        throw new Error(`Error ${response.status}: ${data?.error || response.statusText}`);
      }
      
      // Extract results from the response
      const importedCount = data?.results?.created || 0;
      const errorCount = data?.results?.errors || 0;
      const skippedCount = data?.results?.skipped || 0;
      
      // Log detailed information
      console.log(`Import results - Created: ${importedCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`);
      
      // Even if errorCount > 0, refresh the contact list anyway
      queryClient.invalidateQueries({ queryKey: ['contacts', user.id] });
      
      if (importedCount > 0) {
        toast({
          title: "Import Successful",
          description: `Imported ${importedCount} contacts successfully.${
            skippedCount > 0 ? ` (${skippedCount} already existed or were invalid)` : ''
          }`
        });
      } else if (skippedCount > 0 && errorCount === 0) {
        toast({
          title: "No New Contacts",
          description: `All ${skippedCount} contacts were skipped (already exist or missing email address).`
        });
      } else if (errorCount > 0) {
        // If edge function import had errors, automatically try direct import without prompting
        console.log("Edge function import had errors, automatically trying direct import");
        return await importContactsDirectly(contactsToImport);
      } else {
        toast({
          title: "No Contacts Imported",
          description: "No contacts were imported. They may already exist in your contacts.",
          variant: "destructive"
        });
      }
      
      // Reset state
      setPreviewContacts([]);
      setHasPreviewedContacts(false);
      
      return true;
    } catch (error) {
      console.error("Error importing Gmail contacts:", error);
      
      toast({
        title: "Import Failed",
        description: error.message || "There was a problem importing your contacts.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset state
  const resetState = () => {
    setPreviewContacts([]);
    setHasPreviewedContacts(false);
  };
  
  // A fallback method that imports contacts directly using the ContactsContext
  const importContactsDirectly = async (contacts) => {
    console.log("Attempting direct import via ContactsContext for", contacts.length, "contacts");
    let successCount = 0;
    let failureCount = 0;
    
    setIsLoading(true);
    
    try {
      // Process each contact one by one
      for (const contact of contacts) {
        try {
          // Map from our import format to ContactsContext format
          const contactData = {
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            title: contact.title,
            website: contact.website,
            tags: contact.tags
          };
          
          console.log("Adding contact directly:", contactData);
          
          // Add contact via the context
          await addContact(contactData);
          
          successCount++;
          console.log(`Successfully added contact: ${contact.email}`);
        } catch (contactError) {
          failureCount++;
          console.error(`Failed to add contact ${contact.email}:`, contactError);
        }
      }
      
      // Show appropriate toast based on results
      if (successCount > 0) {
        toast({
          title: "Contacts Imported",
          description: `Successfully imported ${successCount} contacts${
            failureCount > 0 ? ` (${failureCount} failed)` : ''
          }`
        });
        
        // Reset state
        setPreviewContacts([]);
        setHasPreviewedContacts(false);
        
        return true;
      } else {
        toast({
          title: "Direct Import Failed",
          description: "Could not import any contacts directly. Please check the console for errors.",
          variant: "destructive"
        });
        
        return false;
      }
    } catch (error) {
      console.error("Error in direct import:", error);
      
      toast({
        title: "Direct Import Failed",
        description: error.message || "There was a problem importing your contacts directly.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    previewContacts,
    hasPreviewedContacts,
    fetchGmailIntegration,
    previewGmailContacts,
    importGmailContacts,
    resetState,
    selectedCategories,
    setSelectedCategories
  };
} 