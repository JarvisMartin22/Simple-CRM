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
  const { createContact, refreshContacts } = useContacts();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [includeNoEmail, setIncludeNoEmail] = useState(false);
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

      console.log('Found Gmail integration:', {
        id: integration.id,
        hasAccessToken: !!integration.access_token,
        hasRefreshToken: !!integration.refresh_token,
        expiresAt: integration.expires_at
      });

      // Check if token is expired and refresh if needed
      const now = new Date();
      const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;
      const isTokenExpired = tokenExpiry && now > tokenExpiry;
      
      if (isTokenExpired && integration.refresh_token) {
        console.log('Access token expired, refreshing...');
        try {
          const refreshResponse = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/gmail-auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              refresh_token: integration.refresh_token
            })
          });
          
          if (!refreshResponse.ok) {
            throw new Error('Failed to refresh token');
          }
          
          const tokenData = await refreshResponse.json();
          
          // Update the token in the database
          const { error: updateError } = await supabase
            .from('user_integrations')
            .update({
              access_token: tokenData.access_token,
              expires_at: tokenData.expires_at
            })
            .eq('id', integration.id);
            
          if (updateError) {
            throw new Error('Failed to update token in database');
          }
          
          // Update our local integration object
          integration.access_token = tokenData.access_token;
          integration.expires_at = tokenData.expires_at;
          
          console.log('Token refreshed successfully');
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          throw new Error('Failed to refresh access token. Please reconnect Gmail.');
        }
      }

      // Call the Gmail contacts import function
      console.log('Calling Gmail contacts import function with token:', {
        tokenLength: integration.access_token?.length,
        tokenStart: integration.access_token?.substring(0, 10) + '...',
        expiresAt: integration.expires_at,
        includeNoEmail
      });
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/gmail-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'X-Gmail-Token': integration.access_token,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          integration_id: integration.id,
          access_token: integration.access_token,
          refresh_token: integration.refresh_token,
          include_no_email: includeNoEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Gmail contacts import failed:', { 
          status: response.status, 
          statusText: response.statusText,
          data: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error('Failed to fetch Gmail contacts: ' + response.statusText);
      }

      const data = await response.json();
      console.log('Received contacts data:', {
        totalContacts: data.contacts?.length || 0,
        error: data.error,
        firstContact: data.contacts?.[0] ? {
          hasName: !!(data.contacts[0].firstName || data.contacts[0].lastName),
          hasEmail: !!data.contacts[0].email,
          hasCompany: !!data.contacts[0].company,
          fullContact: data.contacts[0]
        } : null
      });
      const contacts = data.contacts || [];
      
      if (contacts.length === 0) {
        console.warn('No contacts received from Edge Function - check Gmail API access and response');
        toast({
          title: 'No Contacts Found',
          description: data.error || 'No contacts found in your Gmail account. Please check your permissions.',
          variant: 'destructive'
        });
        return;
      }

      // Process each contact
      let successful = 0;
      let failed = 0;
      const total = contacts.length;

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        try {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          const companyName = contact.company || contact.organizations?.[0]?.name;
          let companyId = null;

          // If we have a company name, try to find or create the company
          if (companyName && userId) {
            // Try to find existing company
            const { data: existingCompanies } = await supabase
              .from('companies')
              .select('id')
              .eq('user_id', userId)
              .eq('name', companyName)
              .maybeSingle();

            if (existingCompanies) {
              companyId = existingCompanies.id;
            } else {
              // Create new company
              const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert({
                  user_id: userId,
                  name: companyName,
                  website: contact.website || contact.urls?.[0]?.value || null
                })
                .select('id')
                .single();

              if (!companyError && newCompany) {
                companyId = newCompany.id;
              }
            }
          }

          // Insert contact
          const contactData: Record<string, any> = {
            user_id: userId,
            first_name: contact.firstName || contact.names?.[0]?.givenName || '',
            last_name: contact.lastName || contact.names?.[0]?.familyName || '',
            email: contact.email || contact.emailAddresses?.[0]?.value || '',
            phone: contact.phone || contact.phoneNumbers?.[0]?.value || '',
            title: contact.title || contact.organizations?.[0]?.title || '',
            company_id: companyId,
            website: contact.website || contact.urls?.[0]?.value || '',
            source: 'gmail',
            tags: Array.isArray(contact.tags) ? contact.tags : ['gmail-import']
          };
          
          console.log(`Inserting contact ${i+1}/${contacts.length}:`, JSON.stringify(contactData));
          
          // Try regular insert first
          const { error: insertError } = await supabase.from('contacts').insert({
            ...contactData,
            tags: Array.isArray(contactData.tags) ? contactData.tags : ['gmail-import']
          });

          if (insertError) {
            console.error('Failed to insert contact:', {
              error: insertError,
              code: insertError.code,
              message: insertError.message,
              details: insertError.details,
              tagsValue: contactData.tags,
              tagsType: typeof contactData.tags
            });
            
            // If array error, try direct SQL query as fallback
            if (insertError.code === '22P02' && insertError.message.includes('array')) {
              console.log('Trying direct SQL query as fallback');
              
              // Try the stored procedure with proper array handling
              const { data: sqlResult, error: sqlError } = await supabase.rpc(
                'create_contact',
                {
                  p_user_id: userId,
                  p_first_name: contact.firstName || '',
                  p_last_name: contact.lastName || '',
                  p_email: contact.email || '',
                  p_phone: contact.phone || '',
                  p_title: contact.title || '',
                  p_company_id: companyId,
                  p_website: contact.website || '',
                  p_notes: '',
                  p_tags: ['gmail-import']
                }
              );
              
              if (sqlError) {
                console.error('SQL fallback failed:', sqlError);
                
                // Last resort: try simplified contact without tags
                console.log('Trying simplified contact without tags as last resort');
                const simplifiedContact = {
                  user_id: userId,
                  first_name: contact.firstName || '',
                  last_name: contact.lastName || '',
                  email: contact.email || '',
                  website: contact.website || '',
                  tags: '{gmail-import}'  // PostgreSQL array literal syntax
                };
                
                const { error: simpleError } = await supabase
                  .from('contacts')
                  .insert(simplifiedContact);
                
                if (simpleError) {
                  failed++;
                } else {
                  successful++;
                }
              } else {
                console.log('SQL fallback succeeded:', sqlResult);
                successful++;
              }
            } else {
              failed++;
            }
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

      console.log(`Import completed: ${successful} successful, ${failed} failed`);

      // Refresh the contacts list
      await refreshContacts();

      toast({
        title: "Import Complete",
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
  }, [includeNoEmail, createContact, refreshContacts]);

  return {
    importFromGmail,
    isImporting,
    importProgress,
    includeNoEmail,
    setIncludeNoEmail
  };
}

export default useGmailContactsImport;
