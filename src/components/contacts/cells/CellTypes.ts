
import { ContactField } from '@/contexts/ContactsContext';
import { CompanyField } from '@/contexts/CompaniesContext';

export type Field = ContactField | CompanyField;

export interface BaseCellProps {
  value: any;
  field: Field;
  onSave: (value: any) => void;
  onCancel: () => void;
}

export interface ViewCellProps {
  value: any;
  field: Field;
  onClick: () => void;
}

export interface CellRendererProps {
  field: string;
  value: any;
  row: any;
  fields: Field[];
  onChange?: (field: string, value: any) => void;
  isEditable?: boolean;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
  entityType: 'contact' | 'company';
}
