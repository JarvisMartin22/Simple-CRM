
import { Contact, ContactField } from '@/contexts/ContactsContext';

export interface BaseCellProps {
  contact: Contact;
  field: ContactField;
  value: any;
  onSave: (value: any) => void;
  onCancel: () => void;
}

export interface ViewCellProps {
  contact: Contact;
  field: ContactField;
  value: any;
  onClick: () => void;
}
