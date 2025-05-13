
import React from 'react';
import { Contact, ContactField } from '@/contexts/ContactsContext';
import { TextCellEdit, TextCellView } from './TextCell';
import { NumberCellEdit, NumberCellView } from './NumberCell';
import { UrlCellEdit, UrlCellView } from './UrlCell';
import { CheckboxCellEdit, CheckboxCellView } from './CheckboxCell';
import { DateCellEdit, DateCellView } from './DateCell';
import { SelectCellEdit, SelectCellView } from './SelectCell';
import { MultiSelectCellEdit, MultiSelectCellView } from './MultiSelectCell';

interface TableCellRendererProps {
  contact: Contact;
  field: ContactField;
  isEditing: boolean;
  onSave: (value: any) => void;
  onCancel: () => void;
  onClick: () => void;
}

const TableCellRenderer: React.FC<TableCellRendererProps> = ({ 
  contact, 
  field, 
  isEditing,
  onSave,
  onCancel,
  onClick
}) => {
  const value = contact[field.id];
  
  if (isEditing) {
    switch (field.type) {
      case 'number':
        return <NumberCellEdit value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      
      case 'url':
        return <UrlCellEdit value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      
      case 'checkbox':
        return <CheckboxCellEdit value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      
      case 'date':
        return <DateCellEdit value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      
      case 'select':
        return <SelectCellEdit value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      
      case 'multi-select':
        return <MultiSelectCellEdit value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      
      default:
        return <TextCellEdit value={value} field={field} onSave={onSave} onCancel={onCancel} />;
    }
  }
  
  // View mode
  switch (field.type) {
    case 'number':
      return <NumberCellView value={value} field={field} onClick={onClick} contact={contact} />;
    
    case 'url':
      return <UrlCellView value={value} field={field} onClick={onClick} contact={contact} />;
    
    case 'checkbox':
      return <CheckboxCellView value={value} field={field} onClick={onClick} contact={contact} />;
    
    case 'date':
      return <DateCellView value={value} field={field} onClick={onClick} contact={contact} />;
    
    case 'select':
      return <SelectCellView value={value} field={field} onClick={onClick} contact={contact} />;
    
    case 'multi-select':
      return <MultiSelectCellView value={value} field={field} onClick={onClick} contact={contact} />;
    
    default:
      return <TextCellView value={value} field={field} onClick={onClick} contact={contact} />;
  }
};

export default TableCellRenderer;
