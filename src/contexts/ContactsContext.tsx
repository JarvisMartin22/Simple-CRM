import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Database, Industry } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useCompanyEnrichment } from '@/hooks/useCompanyEnrichment';

type ContactRow = Database['public']['Tables']['contacts']['Row'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

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
  color?: string;
}

// Define the Contact type with relationships
export interface Contact extends ContactRow {
  company?: {
    id: string;
    name: string;
    industry: Industry;
  };
  employment_history?: Array<{
    id: string;
    company_id: string;
    title: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    company?: {
      name: string;
      industry: Industry;
    };
  }>;
  custom_fields?: Array<{
    id: string;
    field_name: string;
    value: string;
    type: 'text' | 'number' | 'date' | 'boolean';
  }>;
  tags?: string[];
  email_stats?: {
    total_sent: number;
    replies: number;
    response_rate: number;
    linked_deals: number;
    revenue: number;
  };
}

interface ContactsContextType {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  isLoading: boolean;
  createContact: (data: Partial<Contact>) => Promise<Contact>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  searchContacts: (query: string) => Promise<Contact[]>;
  fields: ContactField[];
  setFields: React.Dispatch<React.SetStateAction<ContactField[]>>;
  createField: (field: Partial<ContactField>) => void;
  updateField: (id: string, updates: Partial<ContactField>) => void;
  deleteField: (id: string) => void;
  refetchContacts: () => Promise<void>;
  toggleFieldVisibility: (id: string) => void;
  refreshContacts: () => Promise<void>;
  availableTags: string[];
  refreshTags: () => Promise<void>;
}

export const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { enrichDomain } = useCompanyEnrichment();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fields, setFields] = useState<ContactField[]>([
    { id: uuidv4(), name: 'first_name', label: 'First Name', type: 'text', visible: true, required: true },
    { id: uuidv4(), name: 'last_name', label: 'Last Name', type: 'text', visible: true, required: true },
    { id: uuidv4(), name: 'email', label: 'Email', type: 'email', visible: true, required: false },
    { id: uuidv4(), name: 'phone', label: 'Phone', type: 'phone', visible: true, required: false },
    { id: uuidv4(), name: 'linkedin', label: 'LinkedIn', type: 'url', visible: true, required: false },
    { id: uuidv4(), name: 'company_id', label: 'Company', type: 'select', visible: true, required: false }
  ]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const { toast } = useToast();

  const refreshContacts = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          companies(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching contacts: ${error.message}`);
      }

      setContacts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching contacts",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const createContact = useCallback(async (data: Partial<Contact>): Promise<Contact> => {
    // Enhance contact data with company information if email is provided
    let enrichedData = { ...data };
    
    if (data.email && !data.company_id) {
      const domain = data.email.split('@')[1];
      if (domain) {
        try {
          const enrichmentResult = await enrichDomain(domain);
          if (enrichmentResult && !enrichmentResult.is_generic && enrichmentResult.company_name) {
            // Try to find existing company or create new one
            const { data: existingCompany } = await supabase
              .from('companies')
              .select('id')
              .eq('user_id', user?.id)
              .eq('domain', domain)
              .maybeSingle();
              
            if (existingCompany) {
              enrichedData.company_id = existingCompany.id;
            } else {
              // Create new company
              const { data: newCompany } = await supabase
                .from('companies')
                .insert({
                  user_id: user?.id,
                  name: enrichmentResult.company_name,
                  domain: domain,
                  website: enrichmentResult.website
                })
                .select('id')
                .single();
                
              if (newCompany) {
                enrichedData.company_id = newCompany.id;
              }
            }
          }
        } catch (error) {
          console.warn('Company enrichment failed for manual contact creation:', error);
        }
      }
    }

    const { data: contact, error } = await supabase
      .from('contacts')
      .insert([enrichedData])
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating contact",
        description: error.message,
      });
      throw error;
    }

    setContacts(prev => [contact, ...prev]);
    
    toast({
      title: "Contact created",
      description: "The contact has been created successfully",
    });

    return contact;
  }, [toast, enrichDomain, user]);

  const updateContact = useCallback(async (id: string, data: Partial<Contact>): Promise<Contact> => {
    const { data: contact, error } = await supabase
      .from('contacts')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating contact",
        description: error.message,
      });
      throw error;
    }

    setContacts(prev => prev.map(c => c.id === id ? contact : c));
    
    toast({
      title: "Contact updated",
      description: "The contact has been updated successfully",
    });

    return contact;
  }, [toast]);

  const deleteContact = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting contact",
        description: error.message,
      });
      throw error;
    }

    setContacts(prev => prev.filter(c => c.id !== id));
    
    toast({
      title: "Contact deleted",
      description: "The contact has been deleted successfully",
    });
  }, [toast]);

  const searchContacts = async (query: string): Promise<Contact[]> => {
    if (!user) return [];
    if (!query) return contacts;

    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.first_name?.toLowerCase().includes(lowerQuery) ||
      contact.last_name?.toLowerCase().includes(lowerQuery) ||
      contact.email?.toLowerCase().includes(lowerQuery) ||
      contact.company?.name?.toLowerCase().includes(lowerQuery)
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
    await refreshContacts();
  };

  // Add toggleFieldVisibility function
  const toggleFieldVisibility = (id: string) => {
    setFields(fields.map(field => 
      field.id === id && !field.required 
        ? { ...field, visible: !field.visible } 
        : field
    ));
  };

  // Function to refresh available tags
  const refreshTags = useCallback(async () => {
    if (!user) return;

    try {
      // Get all unique tags from contacts
      const uniqueTags = new Set<string>();
      contacts.forEach(contact => {
        if (contact.tags) {
          contact.tags.forEach(tag => uniqueTags.add(tag));
        }
      });
      setAvailableTags(Array.from(uniqueTags).sort());
    } catch (error) {
      console.error('Error refreshing tags:', error);
    }
  }, [contacts, user]);

  // Refresh tags whenever contacts change
  useEffect(() => {
    refreshTags();
  }, [contacts, refreshTags]);

  React.useEffect(() => {
    if (user) {
      refreshContacts();
    }
  }, [user, refreshContacts]);

  const value = React.useMemo(() => ({
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
    toggleFieldVisibility,
    refreshContacts,
    availableTags,
    refreshTags,
  }), [contacts, isLoading, createContact, updateContact, deleteContact, searchContacts, fields, setFields, createField, updateField, deleteField, refetchContacts, toggleFieldVisibility, refreshContacts, availableTags, refreshTags]);

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return context;
}
