
import { useState, useCallback } from 'react';
import { useContacts, Contact } from '@/contexts/ContactsContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseGmailContactsImportReturn {
  importFromGmail: () => Promise<void>;
  isImporting: boolean;
  importProgress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
}

export function useGmailContactsImport(): UseGmailContactsImportReturn {
  const { createContact } = useContacts();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0
  });

  const importFromGmail = useCallback(async () => {
    if (!user) {
      toast.error('You must be logged in to import contacts');
      return;
    }

    setIsImporting(true);
    setImportProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0
    });

    try {
      // Fetch contacts from Gmail preview function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/gmail-contacts-preview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase-access-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Gmail contacts: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.contacts || data.contacts.length === 0) {
        toast.warning('No Gmail contacts found to import');
        setIsImporting(false);
        return;
      }

      const contacts = data.contacts;
      setImportProgress(prev => ({
        ...prev,
        total: contacts.length
      }));

      // Process each contact
      for (const contact of contacts) {
        try {
          // Extract the data we need
          const contactData: Partial<Contact> = {
            user_id: user.id,
            first_name: contact.firstName || contact.names?.[0]?.givenName || '',
            last_name: contact.lastName || contact.names?.[0]?.familyName || '',
            email: contact.email || contact.emailAddresses?.[0]?.value || '',
            phone: contact.phone || contact.phoneNumbers?.[0]?.value || '',
            title: contact.title || contact.organizations?.[0]?.title || '',
            website: contact.website || contact.urls?.[0]?.value || '',
            tags: contact.tags || ['gmail-import'],
          };

          // We need at least an email or name to create a contact
          if ((contactData.first_name || contactData.last_name) || contactData.email) {
            await createContact(contactData);
            
            setImportProgress(prev => ({
              ...prev,
              processed: prev.processed + 1,
              successful: prev.successful + 1
            }));
          } else {
            throw new Error('Contact requires either a name or email');
          }
        } catch (error) {
          console.error('Error importing Gmail contact:', error);
          setImportProgress(prev => ({
            ...prev,
            processed: prev.processed + 1,
            failed: prev.failed + 1
          }));
        }
      }

      toast.success(`Successfully imported ${importProgress.successful} contacts from Gmail`);
    } catch (error) {
      console.error('Gmail contact import failed:', error);
      toast.error('Failed to import contacts from Gmail');
    } finally {
      setIsImporting(false);
    }
  }, [user, createContact]);

  return {
    importFromGmail,
    isImporting,
    importProgress
  };
}

export default useGmailContactsImport;
