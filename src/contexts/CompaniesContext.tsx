
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

// No mock companies data - starting with empty array
const emptyCompanies: Company[] = [];

export const CompaniesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(emptyCompanies);
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
