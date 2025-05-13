
import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from './FormField';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyOptionLabel?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  emptyOptionLabel = "None",
  disabled = false,
  required = false,
  error,
}) => {
  // Ensure we have a non-null string value for the component
  const displayValue = value === null ? "none" : value;
  
  const handleValueChange = (newValue: string) => {
    // Convert "none" back to null for the parent component
    onChange(newValue === "none" ? null : newValue);
  };

  return (
    <FormField id={id} label={label} required={required} error={error}>
      <Select
        value={displayValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {/* Empty option for clearing the selection */}
            <SelectItem value="none">{emptyOptionLabel}</SelectItem>
            
            {/* Actual options */}
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FormField>
  );
};
