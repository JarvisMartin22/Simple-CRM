
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Define the Contact type
export interface Contact {
  id?: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  company_id?: string;
  website?: string; // Changed from string[] to string for Supabase compatibility
  notes?: string;
  status?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  companies?: {
    name?: string;
    domain?: string;
  };
}

// Define the field type enum
export type FieldType = 'text' | 'number' | 'email' | 'phone' | 'date' | 'url' | 'select' | 'multi-select' | 'checkbox';

// Define the ContactField type
export interface ContactField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  visible: boolean;
  required: boolean;
  options?: SelectOption[];
}

// Define the SelectOption type
export interface SelectOption {
  value: string;
  label: string;
}

interface ContactsContextType {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  isLoading: boolean;
  createContact: (contact: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  searchContacts: (query: string) => Promise<Contact[]>;
  fields: ContactField[];
  setFields: React.Dispatch<React.SetStateAction<ContactField[]>>;
  createField: (field: Partial<ContactField>) => void;
  updateField: (id: string, updates: Partial<ContactField>) => void;
  deleteField: (id: string) => void;
  refetchContacts: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [fields, setFields] = useState<ContactField[]>([
    { id: uuidv4(), name: 'first_name', label: 'First Name', type: 'text', visible: true, required: true },
    { id: uuidv4(), name: 'last_name', label: 'Last Name', type: 'text', visible: true, required: true },
    { id: uuidv4(), name: 'email', label: 'Email', type: 'email', visible: true, required: false },
    { id: uuidv4(), name: 'phone', label: 'Phone', type: 'phone', visible: true, required: false },
    { id: uuidv4(), name: 'title', label: 'Title', type: 'text', visible: true, required: false },
    { id: uuidv4(), name: 'company', label: 'Company', type: 'text', visible: true, required: false },
    { id: uuidv4(), name: 'website', label: 'Website', type: 'url', visible: true, required: false },
    { id: uuidv4(), name: 'notes', label: 'Notes', type: 'text', visible: true, required: false },
    { id: uuidv4(), name: 'tags', label: 'Tags', type: 'multi-select', visible: true, required: false },
  ]);

  // Load contacts when the user changes
  useEffect(() => {
    if (user) {
      fetchContacts();
    } else {
      setContacts([]);
    }
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          companies(name, domain)
        `)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createContact = async (contactData: Partial<Contact>): Promise<Contact> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const contact: Contact = {
        ...contactData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: contactData.tags || [],
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...contact,
          // Ensure website is a string for Supabase compatibility
          website: typeof contact.website === 'string' ? contact.website : undefined
        }])
        .select();

      if (error) {
        throw error;
      }

      const newContact = data[0] as Contact;
      setContacts(prevContacts => [...prevContacts, newContact]);
      return newContact;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          // Ensure website is a string for Supabase compatibility
          website: typeof updates.website === 'string' ? updates.website : undefined
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === id ? { ...contact, ...updates, updated_at: new Date().toISOString() } : contact
        )
      );
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setContacts(prevContacts => prevContacts.filter(contact => contact.id !== id));
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  };

  const searchContacts = async (query: string): Promise<Contact[]> => {
    if (!user) return [];
    if (!query) return contacts;

    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.first_name?.toLowerCase().includes(lowerQuery) ||
      contact.last_name?.toLowerCase().includes(lowerQuery) ||
      contact.email?.toLowerCase().includes(lowerQuery) ||
      contact.company?.toLowerCase().includes(lowerQuery)
    );
  };

  // Field management functions
  const createField = (fieldData: Partial<ContactField>) => {
    const newField: ContactField = {
      id: uuidv4(),
      name: fieldData.name || '',
      label: fieldData.label || fieldData.name || '',
      type: fieldData.type || 'text',
      visible: fieldData.visible !== undefined ? fieldData.visible : true,
      required: fieldData.required !== undefined ? fieldData.required : false,
      options: fieldData.options,
    };

    setFields(prevFields => [...prevFields, newField]);
  };

  const updateField = (id: string, updates: Partial<ContactField>) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const deleteField = (id: string) => {
    setFields(prevFields => prevFields.filter(field => field.id !== id));
  };

  const refetchContacts = async () => {
    await fetchContacts();
  };

  const contextValue: ContactsContextType = {
    contacts,
    setContacts,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    fields,
    setFields,
    createField,
    updateField,
    deleteField,
    refetchContacts,
  };

  return (
    <ContactsContext.Provider value={contextValue}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContacts = () => {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
};

export default ContactsContext;
