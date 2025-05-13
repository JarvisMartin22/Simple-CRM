
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for our company fields
export type CompanyFieldType = 
  | 'text' | 'number' | 'select' | 'multi-select' | 'status' 
  | 'date' | 'files-media' | 'checkbox' | 'url' | 'email' 
  | 'phone' | 'formula' | 'relation' | 'created-time' 
  | 'last-edited-time';

export interface SelectOption {
  label: string;
  value: string;
  color: string;
}

export interface CompanyField {
  id: string;
  name: string;
  type: CompanyFieldType;
  visible: boolean;
  required: boolean;
  options?: SelectOption[]; // For select, multi-select and status types
}

export interface Company {
  id: string;
  [key: string]: any; // Dynamic fields
}

interface CompaniesContextType {
  companies: Company[];
  fields: CompanyField[];
  visibleFields: CompanyField[];
  addField: (field: Omit<CompanyField, 'id'>) => void;
  updateField: (id: string, updates: Partial<CompanyField>) => void;
  toggleFieldVisibility: (id: string) => void;
  deleteField: (id: string) => void;
  updateCompany: (id: string, field: string, value: any) => void;
}

const CompaniesContext = createContext<CompaniesContextType | undefined>(undefined);

// Default fields based on requirements
const defaultFields: CompanyField[] = [
  { id: 'company_name', name: 'Company Name', type: 'text', visible: true, required: true },
  { id: 'websites', name: 'Website(s)', type: 'url', visible: true, required: false },
  { id: 'customer_type', name: 'Customer Type', type: 'select', visible: true, required: false, options: [
    { label: 'Client', value: 'client', color: '#9b87f5' },
    { label: 'Lead', value: 'lead', color: '#F97316' },
    { label: 'Partner', value: 'partner', color: '#0EA5E9' },
    { label: 'Vendor', value: 'vendor', color: '#8B5CF6' }
  ] },
  { id: 'assigned_to', name: 'Assigned To', type: 'text', visible: true, required: false },
  { id: 'tags', name: 'Tags', type: 'multi-select', visible: true, required: false, options: [] },
  { id: 'created_date', name: 'Created Date', type: 'date', visible: true, required: false },
  { id: 'last_modified_date', name: 'Last Modified Date', type: 'date', visible: true, required: false }
];

// Mock companies data for demo
const mockCompanies: Company[] = [
  {
    id: '1',
    company_name: 'Acme Inc',
    websites: 'https://acme.example.com',
    customer_type: 'client',
    assigned_to: 'John Doe',
    tags: ['Tech', 'Manufacturing'],
    created_date: '2023-05-10',
    last_modified_date: '2023-05-15'
  },
  {
    id: '2',
    company_name: 'TechCorp',
    websites: 'https://techcorp.example.com',
    customer_type: 'lead',
    assigned_to: 'Jane Smith',
    tags: ['Tech', 'Software'],
    created_date: '2023-04-12',
    last_modified_date: '2023-05-18'
  },
  {
    id: '3',
    company_name: 'Design Studio',
    websites: 'https://designstudio.example.com',
    customer_type: 'client',
    assigned_to: 'Mike Johnson',
    tags: ['Design', 'Creative'],
    created_date: '2023-03-22',
    last_modified_date: '2023-05-05'
  },
  {
    id: '4',
    company_name: 'Global Services',
    websites: 'https://globalservices.example.com',
    customer_type: 'partner',
    assigned_to: 'Sarah Williams',
    tags: ['Consulting', 'International'],
    created_date: '2023-01-08',
    last_modified_date: '2023-04-30'
  },
  {
    id: '5',
    company_name: 'Finance Plus',
    websites: 'https://financeplus.example.com',
    customer_type: 'client',
    assigned_to: 'Robert Taylor',
    tags: ['Finance', 'Banking'],
    created_date: '2023-02-15',
    last_modified_date: '2023-05-08'
  }
];

export const CompaniesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [fields, setFields] = useState<CompanyField[]>(defaultFields);

  // Get visible fields
  const visibleFields = fields.filter(field => field.visible);

  // Add new field
  const addField = (field: Omit<CompanyField, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9); // Simple ID generation
    setFields([...fields, { ...field, id }]);
  };

  // Update existing field
  const updateField = (id: string, updates: Partial<CompanyField>) => {
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

  // Update company field value
  const updateCompany = (id: string, fieldId: string, value: any) => {
    setCompanies(companies.map(company => 
      company.id === id ? { ...company, [fieldId]: value } : company
    ));
  };

  return (
    <CompaniesContext.Provider 
      value={{ 
        companies, 
        fields, 
        visibleFields, 
        addField, 
        updateField, 
        toggleFieldVisibility, 
        deleteField,
        updateCompany 
      }}
    >
      {children}
    </CompaniesContext.Provider>
  );
};

export const useCompanies = () => {
  const context = useContext(CompaniesContext);
  if (context === undefined) {
    throw new Error('useCompanies must be used within a CompaniesProvider');
  }
  return context;
};
