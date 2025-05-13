
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  options: SelectOption[];
  value?: string | null;
  onValueChange: (value: string) => void;
  placeholder: string;
  emptyOption?: boolean;
  emptyOptionLabel?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  options,
  value = '',
  onValueChange,
  placeholder,
  emptyOption = false,
  emptyOptionLabel = "None"
}) => {
  // Ensure value is never null or undefined
  const safeValue = value || '';
  
  return (
    <Select 
      value={safeValue}
      onValueChange={onValueChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {emptyOption && <SelectItem value="none">{emptyOptionLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
