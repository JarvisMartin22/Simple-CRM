import React, { useEffect } from 'react';
import { Contact, ContactField } from '@/contexts/ContactsContext';
import { Company, CompanyField } from '@/contexts/CompaniesContext';
import { TextCellEdit, TextCellView } from './TextCell';
import { NumberCellEdit, NumberCellView } from './NumberCell';
import { UrlCellEdit, UrlCellView } from './UrlCell';
import { CheckboxCellEdit, CheckboxCellView } from './CheckboxCell';
import { DateCellEdit, DateCellView } from './DateCell';
import { SelectCellEdit, SelectCellView } from './SelectCell';
import { MultiSelectCellEdit, MultiSelectCellView } from './MultiSelectCell';

interface TableCellRendererProps {
  contact?: Contact;
  company?: Company;
  field: ContactField | CompanyField;
  isEditing: boolean;
  onSave: (value: any) => void;
  onCancel: () => void;
  onClick: () => void;
}

const TableCellRenderer: React.FC<TableCellRendererProps> = ({ 
  contact,
  company,
  field, 
  isEditing,
  onSave,
  onCancel,
  onClick
}) => {
  // Get the value from either contact or company
  const item = contact || company;
  
  // Make sure the field exists in the item (defensive)
  let value = null;
  if (item && field && field.id in item) {
    value = item[field.id];
  } else if (item) {
    console.log(`Field ${field?.id} not found in item, using default value`);
    // Provide default values based on field type
    if (field?.type === 'multi-select') {
      value = [];
    } else if (field?.type === 'number') {
      value = null;
    } else if (field?.type === 'date') {
      value = null;
    } else {
      value = '';
    }
  }
  
  // Defensive fallback for text fields
  const safeValue = (field.type === 'text' && (value === undefined || value === null)) ? '' : value;
  
  // Log state and props for debugging
  console.log(`TableCellRenderer for ${field.id}:`, { 
    isEditing, 
    value, 
    safeValue,
    fieldType: field.type
  });

  if (isEditing) {
    switch (field.type) {
      case 'number':
        return <NumberCellEdit contact={item} value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      case 'url':
        return <UrlCellEdit contact={item} value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      case 'checkbox':
        return <CheckboxCellEdit contact={item} value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      case 'date':
        return <DateCellEdit contact={item} value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      case 'select':
        return <SelectCellEdit contact={item} value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      case 'multi-select':
        return <MultiSelectCellEdit contact={item} value={value} field={field} onSave={onSave} onCancel={onCancel} />;
      default:
        return <TextCellEdit contact={item} value={safeValue} field={field} onSave={onSave} onCancel={onCancel} />;
    }
  }
  
  // Allow clicking anywhere in the cell
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`Cell for ${field.id} clicked`);
    onClick();
  };
  
  return (
    <div onClick={handleClick} className="w-full h-full cursor-pointer p-2">
      {(() => {
        switch (field.type) {
          case 'number':
            return <NumberCellView contact={item} value={value} field={field} onClick={onClick} />;
          case 'url':
            return <UrlCellView contact={item} value={value} field={field} onClick={onClick} />;
          case 'checkbox':
            return <CheckboxCellView contact={item} value={value} field={field} onClick={onClick} />;
          case 'date':
            return <DateCellView contact={item} value={value} field={field} onClick={onClick} />;
          case 'select':
            return <SelectCellView contact={item} value={value} field={field} onClick={onClick} />;
          case 'multi-select':
            return <MultiSelectCellView contact={item} value={value} field={field} onClick={onClick} />;
          default:
            return <TextCellView contact={item} value={safeValue} field={field} onClick={onClick} />;
        }
      })()}
    </div>
  );
};

export default TableCellRenderer;
