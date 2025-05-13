
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

// Mock contacts data for demo
const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    company: 'Acme Inc',
    title: 'Marketing Director',
    tags: ['Client', 'Marketing'],
    type_of_contact: 'client',
    phone_number: '+1 555-123-4567',
    details: 'Key decision maker for marketing strategies',
    website: 'https://acme.example.com',
    last_contacted: '2023-05-10',
    number_of_times_contacted: 8
  },
  {
    id: '2',
    name: 'Michael Brown',
    company: 'TechCorp',
    title: 'CTO',
    tags: ['Prospect', 'Tech'],
    type_of_contact: 'lead',
    phone_number: '+1 555-987-6543',
    details: 'Interested in our enterprise solution',
    website: 'https://techcorp.example.com',
    last_contacted: '2023-05-15',
    number_of_times_contacted: 3
  },
  {
    id: '3',
    name: 'Emma Davis',
    company: 'Design Studio',
    title: 'Creative Director',
    tags: ['Client', 'Design'],
    type_of_contact: 'client',
    phone_number: '+1 555-456-7890',
    details: 'Looking for long-term partnership',
    website: 'https://designstudio.example.com',
    last_contacted: '2023-05-08',
    number_of_times_contacted: 12
  },
  {
    id: '4',
    name: 'James Wilson',
    company: 'InnoTech',
    title: 'CEO',
    tags: ['Lead', 'Executive'],
    type_of_contact: 'lead',
    phone_number: '+1 555-789-0123',
    details: 'Follow up on proposal',
    website: 'https://innotech.example.com',
    last_contacted: '2023-05-18',
    number_of_times_contacted: 2
  },
  {
    id: '5',
    name: 'Olivia Martinez',
    company: 'Global Services',
    title: 'Account Manager',
    tags: ['Partner'],
    type_of_contact: 'partner',
    phone_number: '+1 555-234-5678',
    details: 'Coordinating joint venture',
    website: 'https://globalservices.example.com',
    last_contacted: '2023-05-05',
    number_of_times_contacted: 15
  },
  {
    id: '6',
    name: 'William Taylor',
    company: 'Finance Plus',
    title: 'Financial Advisor',
    tags: ['Client', 'Finance'],
    type_of_contact: 'client',
    phone_number: '+1 555-345-6789',
    details: 'Quarterly review scheduled',
    website: 'https://financeplus.example.com',
    last_contacted: '2023-05-12',
    number_of_times_contacted: 6
  }
];

export const ContactsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
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

  // Update contact field value
  const updateContact = (id: string, fieldId: string, value: any) => {
    setContacts(contacts.map(contact => 
      contact.id === id ? { ...contact, [fieldId]: value } : contact
    ));
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
        updateContact 
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
