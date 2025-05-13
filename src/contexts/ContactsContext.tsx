
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
  { id: 'tags', name: 'Tags', type: 'multi-select', visible: true, required: false, options: [] },
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

// Start with some sample contacts
const sampleContacts: Contact[] = [
  {
    id: '1',
    name: 'John Doe',
    company: 'Acme Inc.',
    title: 'CEO',
    tags: ['important', 'client'],
    type_of_contact: 'client',
    phone_number: '555-1234',
    details: 'Met at conference',
    website: 'https://example.com',
    last_contacted: '2023-04-15',
    number_of_times_contacted: 5
  },
  {
    id: '2',
    name: 'Jane Smith',
    company: 'Tech Solutions',
    title: 'CTO',
    tags: ['tech', 'partner'],
    type_of_contact: 'partner',
    phone_number: '555-5678',
    details: 'Interested in collaboration',
    website: 'https://techsolutions.example',
    last_contacted: '2023-05-20',
    number_of_times_contacted: 3
  }
];

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
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
    setContacts([...contacts, { ...contact, id }]);
  };

  // Update contact field value
  const updateContact = (id: string, fieldId: string, value: any) => {
    console.log("Context updating contact:", { id, fieldId, value });
    
    // Get the field definition to determine how to handle the value
    const fieldDef = fields.find(field => field.id === fieldId);
    
    setContacts(contacts.map(contact => {
      if (contact.id === id) {
        // Create a new contact object with the updated field
        const updatedContact = { ...contact };
        
        // Handle special field types
        if (fieldDef?.type === 'multi-select') {
          // Ensure multi-select values are always arrays
          updatedContact[fieldId] = Array.isArray(value) ? value : value ? [value] : [];
        } else {
          // For all other field types
          updatedContact[fieldId] = value;
        }
        
        return updatedContact;
      }
      return contact;
    }));
  };

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
