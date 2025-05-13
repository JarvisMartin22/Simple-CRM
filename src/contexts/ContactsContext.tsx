
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  [key: string]: any; // Dynamic fields
}

interface ContactsContextType {
  contacts: Contact[];
  fields: ContactField[];
  visibleFields: ContactField[];
  addField: (field: Omit<ContactField, 'id'>) => void;
  updateField: (id: string, updates: Partial<ContactField>) => void;
  toggleFieldVisibility: (id: string) => void;
  deleteField: (id: string) => void;
  updateContact: (id: string, field: string, value: any) => void;
  addContact: (contact: Omit<Contact, 'id'>) => void;
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
  { id: 'details', name: 'Details', type: 'text', visible: true, required: false },
  { id: 'website', name: 'Website', type: 'url', visible: true, required: false },
  { id: 'last_contacted', name: 'Last Contacted', type: 'date', visible: true, required: false },
  { id: 'number_of_times_contacted', name: 'Number of Times Contacted', type: 'number', visible: true, required: false }
];

// Start with an empty contact array
const emptyContacts: Contact[] = [];

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>(emptyContacts);
  const [fields, setFields] = useState<ContactField[]>(defaultFields);

  // Get visible fields
  const visibleFields = fields.filter(field => field.visible);

  // Add new field
  const addField = (field: Omit<ContactField, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9); // Simple ID generation
    setFields([...fields, { ...field, id }]);
  };

  // Update existing field
  const updateField = (id: string, updates: Partial<ContactField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  // Toggle field visibility
  const toggleFieldVisibility = (id: string) => {
    setFields(fields.map(field => 
      field.id === id && !field.required 
        ? { ...field, visible: !field.visible } 
        : field
    ));
  };

  // Delete field if not required
  const deleteField = (id: string) => {
    const fieldToDelete = fields.find(field => field.id === id);
    if (fieldToDelete && !fieldToDelete.required) {
      setFields(fields.filter(field => field.id !== id));
    }
  };

  // Add new contact
  const addContact = (contact: Omit<Contact, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9); // Simple ID generation
    
    // Ensure multi-select fields are arrays
    const processedContact = { ...contact };
    
    fields.forEach(field => {
      if (field.type === 'multi-select' && processedContact[field.id]) {
        if (!Array.isArray(processedContact[field.id])) {
          processedContact[field.id] = [processedContact[field.id]];
        }
      }
    });
    
    setContacts(prev => [...prev, { ...processedContact, id }]);
    console.log("Added new contact:", { ...processedContact, id });
  };

  // Update contact field value with enhanced debugging
  const updateContact = (id: string, fieldId: string, value: any) => {
    console.log("ContactsContext updating contact:", { id, fieldId, value, type: typeof value, isArray: Array.isArray(value) });
    
    // Get the field definition to determine how to handle the value
    const fieldDef = fields.find(field => field.id === fieldId);
    console.log("Field definition:", fieldDef);
    
    setContacts(prevContacts => {
      // Create a new contacts array with the updated contact
      const updatedContacts = prevContacts.map(contact => {
        if (contact.id === id) {
          // Create a new contact object with the updated field
          const updatedContact = { ...contact };
          
          // Handle special field types
          if (fieldDef?.type === 'multi-select') {
            // Always ensure multi-select values are arrays
            updatedContact[fieldId] = Array.isArray(value) ? value : value ? [value] : [];
            console.log("Multi-select value saved as:", updatedContact[fieldId]);
          } else {
            // For all other field types, use the value directly
            updatedContact[fieldId] = value;
            console.log("Standard value saved as:", updatedContact[fieldId]);
          }
          
          return updatedContact;
        }
        return contact;
      });
      
      console.log("Updated contacts array:", updatedContacts);
      return updatedContacts;
    });
  };

  // Debug current state
  useEffect(() => {
    console.log("ContactsContext state:", {
      contacts,
      fields,
      visibleFields
    });
  }, [contacts, fields, visibleFields]);

  return (
    <ContactsContext.Provider 
      value={{ 
        contacts, 
        fields, 
        visibleFields, 
        addField, 
        updateField, 
        toggleFieldVisibility, 
        deleteField,
        updateContact,
        addContact 
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
