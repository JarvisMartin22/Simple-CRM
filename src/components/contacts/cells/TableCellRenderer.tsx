
import React from 'react';
import { CheckboxCellEdit } from './CheckboxCell';
import { DateCellEdit as DateCell } from './DateCell';
import { MultiSelectCellEdit as MultiSelectCell } from './MultiSelectCell';
import { NumberCellEdit as NumberCell } from './NumberCell';
import { SelectCellEdit as SelectCell } from './SelectCell';
import { TextCellEdit as TextCell } from './TextCell';
import { UrlCellEdit as UrlCell } from './UrlCell';
import { ContactField } from '@/contexts/ContactsContext';
import { CompanyField } from '@/contexts/CompaniesContext';
import { CellRendererProps } from './CellTypes';

export const TableCellRenderer: React.FC<CellRendererProps> = ({
  field,
  value,
  row,
  fields,
  onChange,
  isEditable = false,
  onStartEdit,
  onEndEdit,
  entityType
}) => {
  // Find the field configuration
  const fieldConfig = fields.find(f => f.name === field || f.id === field);
  
  if (!fieldConfig) {
    // Default to text cell if field config not found
    return <TextCell 
      value={value} 
      field={null}
      onSave={(val) => onChange?.(field, val)}
      onCancel={() => onEndEdit?.()}
    />;
  }

  // Handle cell changes
  const handleChange = (val: any) => {
    onChange?.(field, val);
    onEndEdit?.();
  };

  // Render different cell types based on the field type
  switch (fieldConfig.type) {
    case 'checkbox':
      return <CheckboxCellEdit 
        value={value} 
        field={fieldConfig}
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
      />;
    
    case 'date':
      return <DateCell 
        value={value} 
        field={fieldConfig}
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
      />;
    
    case 'multi-select':
      return <MultiSelectCell 
        value={value} 
        field={fieldConfig}
        options={fieldConfig.options || []} 
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
      />;
    
    case 'number':
      return <NumberCell 
        value={value} 
        field={fieldConfig}
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
      />;
    
    case 'select':
      return <SelectCell 
        value={value} 
        field={fieldConfig}
        options={fieldConfig.options || []} 
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
      />;
    
    case 'url':
      return <UrlCell 
        value={value} 
        field={fieldConfig}
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
      />;
    
    case 'email':
      return <UrlCell 
        value={value} 
        field={fieldConfig}
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
        protocol="mailto:"
      />;
    
    case 'phone':
      return <UrlCell 
        value={value} 
        field={fieldConfig}
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
        protocol="tel:"
      />;
    
    default:
      return <TextCell 
        value={value} 
        field={fieldConfig}
        onSave={handleChange}
        onCancel={() => onEndEdit?.()}
      />;
  }
};
