import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Contact } from '@/types/contacts';
import { useToast } from '@/components/ui/use-toast';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setContacts(data || []);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch contacts';
      setError(errorMessage);
      toast({
        title: 'Error fetching contacts',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();

      if (createError) throw createError;

      setContacts(prev => [data, ...prev]);
      toast({
        title: 'Contact added',
        description: 'Successfully added new contact.',
      });

      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add contact';
      setError(errorMessage);
      toast({
        title: 'Error adding contact',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setContacts(prev => prev.map(contact => 
        contact.id === id ? { ...contact, ...data } : contact
      ));

      toast({
        title: 'Contact updated',
        description: 'Successfully updated contact details.',
      });

      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update contact';
      setError(errorMessage);
      toast({
        title: 'Error updating contact',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setContacts(prev => prev.filter(contact => contact.id !== id));
      toast({
        title: 'Contact deleted',
        description: 'Successfully deleted contact.',
      });

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete contact';
      setError(errorMessage);
      toast({
        title: 'Error deleting contact',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
  };
}; 