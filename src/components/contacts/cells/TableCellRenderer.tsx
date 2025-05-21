
import React from 'react';
import { CheckboxCellEdit } from './CheckboxCell';
import { DateCellEdit as DateCell } from './DateCell';
import { MultiSelectCellEdit as MultiSelectCell } from './MultiSelectCell';
import { NumberCellEdit as NumberCell } from './NumberCell';
import { SelectCellEdit as SelectCell } from './SelectCell';
import { TextCellEdit as TextCell } from './TextCell';
import { UrlCellEdit as UrlCell } from './UrlCell';
import { ContactField } from '@/contexts/ContactsContext';

interface TableCellRendererProps {
  field: string;
  value: any;
  row: any;
  fields: ContactField[];
  onChange?: (field: string, value: any) => void;
  isEditable?: boolean;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
  entityType: 'contact' | 'company';
}

export const TableCellRenderer: React.FC<TableCellRendererProps> = ({
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
  const fieldConfig = fields.find(f => f.name === field);
  
  if (!fieldConfig) {
    // Default to text cell if field config not found
    return <TextCell 
      value={value} 
      onChange={(val) => onChange?.(field, val)} 
      isEditable={isEditable}
      onStartEdit={onStartEdit}
      onEndEdit={onEndEdit}
    />;
  }

  // Render different cell types based on the field type
  switch (fieldConfig.type) {
    case 'checkbox':
      return <CheckboxCellEdit 
        value={value} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
      />;
    
    case 'date':
      return <DateCell 
        value={value} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
      />;
    
    case 'multi-select':
      return <MultiSelectCell 
        value={value} 
        options={fieldConfig.options || []} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
      />;
    
    case 'number':
      return <NumberCell 
        value={value} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
      />;
    
    case 'select':
      return <SelectCell 
        value={value} 
        options={fieldConfig.options || []} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
      />;
    
    case 'url':
      return <UrlCell 
        value={value} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
      />;
    
    case 'email':
      return <UrlCell 
        value={value} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
        protocol="mailto:"
      />;
    
    case 'phone':
      return <UrlCell 
        value={value} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
        protocol="tel:"
      />;
    
    default:
      return <TextCell 
        value={value} 
        onChange={(val) => onChange?.(field, val)} 
        isEditable={isEditable}
        onStartEdit={onStartEdit}
        onEndEdit={onEndEdit}
      />;
  }
};
