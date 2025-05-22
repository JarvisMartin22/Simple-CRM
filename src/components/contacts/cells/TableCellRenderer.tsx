import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContactField } from '@/contexts/ContactsContext';
import { CompanyField } from '@/contexts/CompaniesContext';

interface TableCellRendererProps {
  field: string | ContactField | CompanyField;
  value: any;
  row: any;
  fields: (ContactField | CompanyField)[];
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
  const fieldName = typeof field === 'string' ? field : field.name;
  const fieldConfig = fields.find(f => f.name === fieldName);

  if (!fieldConfig) {
    return <span>{value}</span>;
  }

  if (isEditable) {
    switch (fieldConfig.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            type={fieldConfig.type}
            value={value || ''}
            onChange={e => onChange?.(fieldName, e.target.value)}
            onFocus={onStartEdit}
            onBlur={onEndEdit}
          />
        );
      case 'select':
        return (
          <Select value={value} onValueChange={value => onChange?.(fieldName, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${fieldConfig.label}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'multi-select':
        if (!Array.isArray(value)) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {value.map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        );
      default:
        return <span>{value}</span>;
    }
  }

  // Read-only view
  switch (fieldConfig.type) {
    case 'multi-select':
      if (!Array.isArray(value)) return null;
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((tag: string) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      );
    case 'select':
      const option = fieldConfig.options?.find(opt => opt.value === value);
      return <span>{option?.label || value}</span>;
    default:
      return <span>{value}</span>;
  }
};

export default TableCellRenderer;
