import { useState, useCallback } from 'react';
import { useContacts } from '@/contexts/ContactsContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
}

export function useGmailContactsImport() {
  const { createContact } = useContacts();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0
  });

  const importFromGmail = useCallback(async () => {
    try {
      setIsImporting(true);
      setImportProgress({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0
      });

      // First check if Gmail is connected
      const { data: integration, error: integrationError } = await supabase
        .from('user_integrations')
        .select('id, access_token, refresh_token, expires_at')
        .eq('provider', 'gmail')
        .maybeSingle();

      if (integrationError) {
        console.error('Failed to check Gmail integration:', integrationError);
        throw new Error('Failed to check Gmail integration');
      }

      if (!integration) {
        throw new Error('Gmail is not connected. Please connect Gmail first.');
      }

      // Call the Gmail contacts import function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/gmail-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'X-Gmail-Token': integration.access_token
        },
        body: JSON.stringify({
          integration_id: integration.id,
          access_token: integration.access_token,
          refresh_token: integration.refresh_token
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Gmail contacts import failed:', { status: response.status, data: errorData });
        throw new Error('Failed to fetch Gmail contacts: ' + response.statusText);
      }

      const data = await response.json();
      const contacts = data.contacts || [];

      // Process each contact
      let successful = 0;
      let failed = 0;
      const total = contacts.length;

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        try {
          const { error: insertError } = await supabase.from('contacts').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            first_name: contact.firstName || contact.names?.[0]?.givenName || '',
            last_name: contact.lastName || contact.names?.[0]?.familyName || '',
            email: contact.email || contact.emailAddresses?.[0]?.value || '',
            phone: contact.phone || contact.phoneNumbers?.[0]?.value || '',
            title: contact.title || contact.organizations?.[0]?.title || '',
            company_name: contact.company || contact.organizations?.[0]?.name || '',
            website: contact.website || contact.urls?.[0]?.value || '',
            tags: [{ id: crypto.randomUUID(), tag_name: 'gmail-import' }],
            source: 'gmail'
          });

          if (insertError) {
            console.error('Failed to insert contact:', insertError);
            failed++;
          } else {
            successful++;
          }

          setImportProgress({
            total,
            processed: i + 1,
            successful,
            failed
          });
        } catch (error) {
          console.error('Error processing contact:', error);
          failed++;
          setImportProgress(prev => ({
            ...prev,
            processed: i + 1,
            failed: prev.failed + 1
          }));
        }
      }

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successful} contacts. ${failed} failed.`
      });

    } catch (error) {
      console.error('Gmail contact import failed:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import contacts',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  }, []);

  return {
    importFromGmail,
    isImporting,
    importProgress
  };
}

export default useGmailContactsImport;
