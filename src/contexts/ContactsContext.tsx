import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Define types for our contact fields
export type FieldType = 
  | 'text' | 'number' | 'select' | 'multi-select' | 'status' 
  | 'date' | 'files-media' | 'checkbox' | 'url' | 'email' 
  | 'phone' | 'formula' | 'relation' | 'created-time' 
  | 'last-edited-time';

export interface SelectOption {
  label: string;
  value: string;
  color: string;
}

export interface ContactField {
  id: string;
  name: string;
  type: FieldType;
  visible: boolean;
  required: boolean;
  options?: SelectOption[]; // For select, multi-select and status types
}

export interface Contact {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  title?: string;
  phone?: string;
  company_id?: string;
  website?: string;
  tags?: string[];
  last_contacted?: string;
  interaction_count?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  companies?: {
    name?: string;
    domain?: string;
  };
}

interface ContactsContextType {
  contacts: Contact[];
  fields: ContactField[];
  visibleFields: ContactField[];
  isLoading: boolean;
  isFetched: boolean;
  showImportDialog: () => void;
  addContact: (contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

// Default fields based on requirements
const defaultFields: ContactField[] = [
  { id: 'name', name: 'Name', type: 'text', visible: true, required: true },
  { id: 'company', name: 'Company', type: 'text', visible: true, required: false },
  { id: 'title', name: 'Title', type: 'text', visible: true, required: false },
  { id: 'tags', name: 'Tags', type: 'multi-select', visible: true, required: false, options: [
    { label: 'Customer', value: 'customer', color: '#10B981' },
    { label: 'Prospect', value: 'prospect', color: '#F59E0B' },
    { label: 'VIP', value: 'vip', color: '#8B5CF6' },
  ] },
  { id: 'type_of_contact', name: 'Type of Contact', type: 'select', visible: true, required: false, options: [
    { label: 'Client', value: 'client', color: '#9b87f5' },
    { label: 'Lead', value: 'lead', color: '#F97316' },
    { label: 'Partner', value: 'partner', color: '#0EA5E9' },
    { label: 'Vendor', value: 'vendor', color: '#8B5CF6' }
  ] },
  { id: 'phone_number', name: 'Phone Number', type: 'phone', visible: true, required: false },
  { id: 'email', name: 'Email', type: 'email', visible: true, required: false },
  { id: 'details', name: 'Details', type: 'text', visible: true, required: false },
  { id: 'website', name: 'Website', type: 'url', visible: true, required: false },
  { id: 'last_contacted', name: 'Last Contacted', type: 'date', visible: true, required: false },
  { id: 'number_of_times_contacted', name: 'Number of Times Contacted', type: 'number', visible: true, required: false }
];

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [fields, setFields] = useState<ContactField[]>(defaultFields);
  const [showImport, setShowImport] = useState(false);
  
  // Get visible fields
  const visibleFields = fields.filter(field => field.visible);
  
  // Fetch contacts from Supabase
  const { 
    data: contacts = [], 
    isLoading, 
    isFetched 
  } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*, companies(name, domain)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching contacts:", error);
        throw error;
      }
      
      return data as Contact[] || [];
    },
    enabled: !!user?.id,
  });
  
  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (newContact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // Create full name from first and last name
      const fullName = `${newContact.first_name || ''} ${newContact.last_name || ''}`.trim();
      
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...newContact,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error adding contact:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contact added",
        description: "The contact has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding contact",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Contact> }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating contact:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contact updated",
        description: "The contact has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating contact",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error deleting contact:", error);
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: "Contact deleted",
        description: "The contact has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting contact",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Add contact handler
  const addContact = async (contact: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await addContactMutation.mutateAsync(contact);
  };
  
  // Update contact handler
  const updateContact = async (id: string, updates: Partial<Contact>) => {
    await updateContactMutation.mutateAsync({ id, updates });
  };
  
  // Delete contact handler
  const deleteContact = async (id: string) => {
    await deleteContactMutation.mutateAsync(id);
  };
  
  // Show import dialog
  const showImportDialog = () => {
    setShowImport(true);
  };

  return (
    <ContactsContext.Provider 
      value={{ 
        contacts: contacts || [], 
        fields, 
        visibleFields,
        isLoading,
        isFetched,
        showImportDialog,
        addContact,
        updateContact,
        deleteContact
      }}
    >
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
