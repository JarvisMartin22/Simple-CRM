import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the Contact type
export type Contact = {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  company_id?: string;
  website?: string; // Changed from string[] to string to match database
  notes?: string;
  status?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  companies?: {
    name?: string;
    domain?: string;
  };
};

// Define SelectOption type for select and multi-select fields
export type SelectOption = {
  value: string;
  label: string;
  color?: string;
};

// Define a type for custom fields
export type ContactField = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'multi-select' | 'checkbox' | 'url' | 'number';
  visible: boolean;
  required?: boolean;
  options?: SelectOption[];
  defaultValue?: any;
};

// For type usage in other files
export type FieldType = 'text' | 'email' | 'phone' | 'date' | 'select' | 'multi-select' | 'checkbox' | 'url' | 'number';

export type ContactsContextType = {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  fields: ContactField[];
  selectedContact: Contact | null;
  fetchContacts: () => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  selectContact: (contact: Contact | null) => void;
  toggleFieldVisibility: (fieldName: string) => void; // Added missing method
  deleteField: (fieldName: string) => void; // Added missing method
  addField: (field: ContactField) => void; // Added missing method
  updateField: (fieldName: string, updates: Partial<ContactField>) => void; // Added missing method
};

// Create the context
const ContactsContext = createContext<ContactsContextType>({
  contacts: [],
  loading: false,
  error: null,
  fields: [],
  selectedContact: null,
  fetchContacts: async () => {},
  addContact: async () => {},
  updateContact: async () => {},
  deleteContact: async () => {},
  selectContact: () => {},
  toggleFieldVisibility: () => {}, // Added missing method
  deleteField: () => {}, // Added missing method
  addField: () => {}, // Added missing method
  updateField: () => {}, // Added missing method
});

// Define default fields
const defaultFields: ContactField[] = [
  { id: 'first_name', name: 'first_name', label: 'First Name', type: 'text', visible: true, required: true },
  { id: 'last_name', name: 'last_name', label: 'Last Name', type: 'text', visible: true, required: true },
  { id: 'email', name: 'email', label: 'Email', type: 'email', visible: true },
  { id: 'phone', name: 'phone', label: 'Phone', type: 'phone', visible: true },
  { id: 'title', name: 'title', label: 'Title', type: 'text', visible: true },
  { id: 'company', name: 'company', label: 'Company', type: 'text', visible: true },
  { id: 'website', name: 'website', label: 'Website', type: 'url', visible: true },
  { id: 'status', name: 'status', label: 'Status', type: 'select', visible: true, options: [
    { value: 'new', label: 'New' }, 
    { value: 'active', label: 'Active' }, 
    { value: 'inactive', label: 'Inactive' }
  ] },
  { id: 'tags', name: 'tags', label: 'Tags', type: 'multi-select', visible: true, options: [
    { value: 'customer', label: 'Customer' }, 
    { value: 'lead', label: 'Lead' }, 
    { value: 'partner', label: 'Partner' }
  ] },
];

// Provider component
export const ContactsProvider = ({ children }: { children: ReactNode }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<ContactField[]>(defaultFields);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  const { toast } = useToast();
  
  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          companies (
            name,
            domain
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      // Convert data to Contact[] type with type assertion
      setContacts(data as unknown as Contact[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contacts';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const addContact = async (contact: Partial<Contact>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure user_id is set
      if (!contact.user_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        contact.user_id = user.id;
      }
      
      // Handle website field type mismatch (string vs string[])
      const contactToInsert = {
        ...contact,
        website: contact.website || '' // Ensure it's a string, not an array
      } as Contact;
      
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactToInsert)
        .select();
      
      if (error) throw new Error(error.message);
      
      if (data && data.length > 0) {
        setContacts(prev => [data[0] as unknown as Contact, ...prev]);
        toast({
          title: 'Success',
          description: 'Contact added successfully',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const updateContact = async (id: string, updates: Partial<Contact>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedContact = {
        ...updates,
        updated_at: new Date().toISOString(),
        website: updates.website || '' // Ensure website is a string
      };
      
      const { error } = await supabase
        .from('contacts')
        .update(updatedContact)
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setContacts(prev => 
        prev.map(contact => 
          contact.id === id ? { ...contact, ...updates } : contact
        )
      );
      
      // Update selected contact if it's the one being updated
      if (selectedContact?.id === id) {
        setSelectedContact(prev => prev ? { ...prev, ...updates } : null);
      }
      
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteContact = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setContacts(prev => prev.filter(contact => contact.id !== id));
      
      // Clear selected contact if it's the one being deleted
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
      
      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const selectContact = (contact: Contact | null) => {
    setSelectedContact(contact);
  };

  // Add the missing field management methods
  const toggleFieldVisibility = (fieldId: string) => {
    setFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, visible: !field.visible } : field
      )
    );
  };

  const deleteField = (fieldId: string) => {
    setFields(prev => prev.filter(field => field.id !== fieldId));
  };

  const addField = (field: ContactField) => {
    setFields(prev => [...prev, field]);
  };

  const updateField = (fieldId: string, updates: Partial<ContactField>) => {
    setFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };
  
  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);
  
  return (
    <ContactsContext.Provider
      value={{
        contacts,
        loading,
        error,
        fields,
        selectedContact,
        fetchContacts,
        addContact,
        updateContact,
        deleteContact,
        selectContact,
        toggleFieldVisibility,
        deleteField,
        addField,
        updateField
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

// Create a hook to use the context
export const useContacts = () => useContext(ContactsContext);
