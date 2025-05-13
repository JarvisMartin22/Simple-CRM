
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
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  emptyOption?: boolean;
  emptyOptionLabel?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  options,
  value,
  onValueChange,
  placeholder,
  emptyOption = false,
  emptyOptionLabel = "None"
}) => {
  return (
    <Select 
      defaultValue={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {emptyOption && <SelectItem value="">{emptyOptionLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
