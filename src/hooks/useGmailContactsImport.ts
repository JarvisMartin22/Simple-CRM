import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

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
}

export function useGmailContactsImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [previewContacts, setPreviewContacts] = useState<ContactPreview[]>([]);
  const [hasPreviewedContacts, setHasPreviewedContacts] = useState(false);
  
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
  const previewGmailContacts = async () => {
    setIsLoading(true);
    console.log("Starting Gmail contacts preview");
    
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
      
      console.log("Calling gmail-contacts-preview edge function");
      
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
            onlyWithName: true
          }
        })
      });
      
      console.log("Edge function response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error response from edge function (${response.status} ${response.statusText}):`, errorData);
        
        try {
          // Try to parse as JSON if possible
          const jsonError = JSON.parse(errorData);
          throw new Error(`Error ${response.status}: ${jsonError.error || response.statusText}`);
        } catch (e) {
          // If can't parse as JSON, use the raw response
          throw new Error(`Error ${response.status}: ${response.statusText}. ${errorData.slice(0, 100)}`);
        }
      }
      
      const data = await response.json();
      console.log("Edge function response:", data);
      
      if (data && data.contacts) {
        console.log(`Found ${data.contacts.length} contacts from Gmail`);
        setPreviewContacts(data.contacts);
        setHasPreviewedContacts(true);
        
        if (data.contacts.length === 0) {
          toast({
            title: "No New Contacts Found",
            description: data.message || "We couldn't find any new contacts to import from your Gmail account."
          });
          
          console.log("No contacts returned from Gmail API. Response:", data);
          return false;
        }
        
        toast({
          title: "Contacts Retrieved",
          description: `Found ${data.contacts.length} contacts from Gmail`
        });
        
        return true;
      } else {
        console.log("No contacts found in response:", data);
        toast({
          title: "No Contacts Found",
          description: "We couldn't find any contacts in your Gmail account."
        });
        
        return false;
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
      const contactsToImport = selectedContacts.map(contact => ({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        company: contact.company,
        title: contact.title,
        phone: contact.phone,
        website: contact.website,
        domain: contact.email && contact.email.includes('@') ? contact.email.split('@')[1] : null,
        tags: ['gmail-import']
      }));
      
      console.log("Prepared contacts for import:", contactsToImport.length);
      
      // Get the user's session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      console.log("Calling import-contacts edge function");
      
      // Call the import-contacts edge function directly with CORS headers
      const response = await fetch(`https://bujaaqjxrvntcneoarkj.supabase.co/functions/v1/import-contacts`, {
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
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error response from edge function (${response.status} ${response.statusText}):`, errorData);
        
        try {
          // Try to parse as JSON if possible
          const jsonError = JSON.parse(errorData);
          throw new Error(`Error ${response.status}: ${jsonError.error || response.statusText}`);
        } catch (e) {
          // If can't parse as JSON, use the raw response
          throw new Error(`Error ${response.status}: ${response.statusText}. ${errorData.slice(0, 100)}`);
        }
      }
      
      const data = await response.json();
      console.log("Import response:", data);
      
      // Invalidate contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['contacts', user.id] });
      
      toast({
        title: "Import Successful",
        description: `Imported ${data.results.created} contacts successfully.`
      });
      
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
  
  return {
    isLoading,
    previewContacts,
    hasPreviewedContacts,
    fetchGmailIntegration,
    previewGmailContacts,
    importGmailContacts,
    resetState
  };
} 