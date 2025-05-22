import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Database, Industry } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';

type CompanyRow = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

// Define types for our company fields
export type CompanyFieldType = 'text' | 'number' | 'email' | 'phone' | 'date' | 'url' | 'select' | 'multi-select' | 'checkbox';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface CompanyField {
  id: string;
  name: string;
  label: string;
  type: CompanyFieldType;
  visible: boolean;
  required: boolean;
  options?: SelectOption[];
}

export interface Company extends CompanyRow {
  contacts_count?: number;
  deals_count?: number;
  total_revenue?: number;
}

interface CompaniesContextType {
  companies: Company[];
  fields: CompanyField[];
  visibleFields: CompanyField[];
  isLoading: boolean;
  addField: (field: Omit<CompanyField, 'id'>) => void;
  updateField: (id: string, updates: Partial<CompanyField>) => void;
  toggleFieldVisibility: (id: string) => void;
  deleteField: (id: string) => void;
  updateCompany: (id: string, updates: CompanyUpdate) => Promise<void>;
  fetchCompanies: () => Promise<void>;
  createCompany: (data: CompanyInsert) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
}

// Default fields based on requirements
const defaultFields: CompanyField[] = [
  { id: 'company_name', name: 'name', label: 'Company Name', type: 'text', visible: true, required: true },
  { id: 'industry', name: 'industry', label: 'Industry', type: 'select', visible: true, required: true, options: [
    { label: 'Technology', value: Industry.Technology },
    { label: 'Healthcare', value: Industry.Healthcare },
    { label: 'Finance', value: Industry.Finance },
    { label: 'Retail', value: Industry.Retail },
    { label: 'Manufacturing', value: Industry.Manufacturing },
    { label: 'Education', value: Industry.Education },
    { label: 'Real Estate', value: Industry.RealEstate },
    { label: 'Consulting', value: Industry.Consulting },
    { label: 'Other', value: Industry.Other }
  ]},
  { id: 'website', name: 'website', label: 'Website', type: 'url', visible: true, required: false },
  { id: 'size', name: 'size', label: 'Size', type: 'select', visible: true, required: false, options: [
    { label: '1-10', value: '1-10' },
    { label: '11-50', value: '11-50' },
    { label: '51-200', value: '51-200' },
    { label: '201-500', value: '201-500' },
    { label: '501-1000', value: '501-1000' },
    { label: '1000+', value: '1000+' }
  ]},
  { id: 'description', name: 'description', label: 'Description', type: 'text', visible: true, required: false }
];

export const CompaniesContext = createContext<CompaniesContextType | undefined>(undefined);

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fields, setFields] = useState<CompanyField[]>(defaultFields);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Get visible fields
  const visibleFields = fields.filter(field => field.visible);

  const refreshCompanies = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching companies: ${error.message}`);
      }

      setCompanies(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching companies",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Load companies when the user changes
  useEffect(() => {
    if (user) {
      refreshCompanies();
    } else {
      setCompanies([]);
    }
  }, [user, refreshCompanies]);

  // Add new field
  const addField = (field: Omit<CompanyField, 'id'>) => {
    const id = uuidv4();
    setFields([...fields, { ...field, id, label: field.label || field.name }]);
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

  // Create new company
  const createCompany = useCallback(async (data: CompanyInsert): Promise<Company> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const company = {
        ...data,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert([company])
        .select()
        .single();

      if (error) throw error;
      if (!newCompany) throw new Error('Failed to create company');

      const companyWithStats: Company = {
        ...newCompany,
        contacts_count: 0,
        deals_count: 0,
        total_revenue: 0
      };

      setCompanies(prevCompanies => [companyWithStats, ...prevCompanies]);
      toast({
        title: "Company created",
        description: "The company has been created successfully",
      });
      return companyWithStats;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating company",
        description: error.message,
      });
      throw error;
    }
  }, [user, toast]);

  // Update company
  const updateCompany = useCallback(async (id: string, updates: CompanyUpdate): Promise<void> => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === id ? { ...company, ...updates, updated_at: new Date().toISOString() } : company
        )
      );
      toast({
        title: "Company updated",
        description: "The company has been updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating company",
        description: error.message,
      });
      throw error;
    }
  }, [toast]);

  // Delete company
  const deleteCompany = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompanies(prevCompanies => prevCompanies.filter(company => company.id !== id));
      toast({
        title: "Company deleted",
        description: "The company has been deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting company",
        description: error.message,
      });
      throw error;
    }
  }, [toast]);

  const value = React.useMemo(() => ({
    companies,
    fields,
    visibleFields,
    isLoading,
    addField,
    updateField,
    toggleFieldVisibility,
    deleteField,
    updateCompany,
    fetchCompanies: refreshCompanies,
    createCompany,
    deleteCompany,
  }), [companies, fields, visibleFields, isLoading, addField, updateField, toggleFieldVisibility, deleteField, updateCompany, refreshCompanies, createCompany, deleteCompany]);

  return (
    <CompaniesContext.Provider value={value}>
      {children}
    </CompaniesContext.Provider>
  );
}

export function useCompanies() {
  const context = useContext(CompaniesContext);
  if (context === undefined) {
    throw new Error('useCompanies must be used within a CompaniesProvider');
  }
  return context;
}
