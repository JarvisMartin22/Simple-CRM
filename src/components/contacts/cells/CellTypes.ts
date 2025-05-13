
import { Contact, ContactField } from '@/contexts/ContactsContext';
import { Company, CompanyField } from '@/contexts/CompaniesContext';

export type Item = Contact | Company;
export type Field = ContactField | CompanyField;

export interface BaseCellProps {
  contact: Item;
  field: Field;
  value: any;
  onSave: (value: any) => void;
  onCancel: () => void;
}

export interface ViewCellProps {
  contact: Item;
  field: Field;
  value: any;
  onClick: () => void;
}
