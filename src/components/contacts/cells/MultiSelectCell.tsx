
import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagInput } from '@/components/ui/tag-input';
import { BaseCellProps, ViewCellProps } from './CellTypes';

// Define the SelectOption interface here to avoid conflicts
interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface MultiSelectCellEditProps extends BaseCellProps {
  options?: SelectOption[];
}

export const MultiSelectCellEdit: React.FC<MultiSelectCellEditProps> = ({ 
  value, 
  field, 
  onSave, 
  onCancel,
  options = [] 
}) => {
  // Handle both string[] and null/undefined
  const initialValues = Array.isArray(value) ? value : [];
  const [selectedValues, setSelectedValues] = useState<string[]>(initialValues);
  const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Update selected options when value changes
  useEffect(() => {
    if (Array.isArray(value)) {
      setSelectedValues(value);
    } else {
      setSelectedValues([]);
    }
  }, [value]);

  // Update selected options whenever selectedValues or options change
  useEffect(() => {
    // Map selected values to their corresponding options
    const selected = selectedValues
      .map(val => options.find(opt => opt.value === val))
      .filter(opt => opt !== undefined) as SelectOption[];
    
    setSelectedOptions(selected);
    setTags(selected.map(opt => opt.label));
  }, [selectedValues, options]);

  const handleTagChange = (newTags: string[]) => {
    // Convert tag labels back to option values
    const newValues = newTags
      .map(tagLabel => {
        // Try to find existing option
        const option = options.find(opt => opt.label === tagLabel);
        
        if (option) return option.value;
        
        // If not found, create a new option with the same label as value
        const newOptionValue = tagLabel.toLowerCase().replace(/\s+/g, '-');
        return newOptionValue;
      });
    
    setSelectedValues(newValues);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      
      const newTag = e.currentTarget.value.trim();
      const newTagValue = newTag.toLowerCase().replace(/\s+/g, '-');
      
      // Check if this tag already exists as an option
      const existingOption = options.find(opt => 
        opt.label.toLowerCase() === newTag.toLowerCase() || 
        opt.value === newTagValue
      );
      
      if (existingOption) {
        // Use existing option
        if (!selectedValues.includes(existingOption.value)) {
          setSelectedValues([...selectedValues, existingOption.value]);
        }
      } else {
        // Create a new option
        const newOption: SelectOption = {
          label: newTag,
          value: newTagValue,
          color: '#F97316' // Default color
        };
        
        setSelectedValues([...selectedValues, newOption.value]);
      }
      
      // Clear the input (handled by TagInput)
    }
  };

  const handleSave = () => {
    onSave(selectedValues.length > 0 ? selectedValues : []);
  };
  
  return (
    <div className="min-w-[220px]">
      <TagInput
        tags={tags}
        setTags={setTags}
        placeholder="Type and press Enter..."
        className="min-h-[120px]"
      />
      
      <div className="mt-4 max-h-[150px] overflow-y-auto">
        <div className="text-xs font-medium mb-2">Suggested options:</div>
        {options.map((option) => (
          <div 
            key={option.value} 
            className={`flex items-center p-1.5 rounded-md cursor-pointer mb-1 hover:bg-coral-50 ${
              selectedValues.includes(option.value) ? 'bg-coral-50' : ''
            }`}
            onClick={() => {
              if (selectedValues.includes(option.value)) {
                setSelectedValues(selectedValues.filter(v => v !== option.value));
              } else {
                setSelectedValues([...selectedValues, option.value]);
              }
            }}
          >
            {option.color && (
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: option.color }} 
              />
            )}
            <span>{option.label}</span>
            {selectedValues.includes(option.value) && (
              <Check size={14} className="ml-auto text-coral-500" />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex mt-4">
        <button 
          onClick={handleSave}
          className="p-1 bg-coral-500 text-white rounded-md text-xs"
        >
          <Check size={14} />
        </button>
        <button 
          onClick={onCancel}
          className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export const MultiSelectCellView: React.FC<ViewCellProps> = ({ value, field, onClick }) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return <div onClick={onClick} className="cursor-pointer h-full w-full">&nbsp;</div>;
  }
  
  return (
    <div onClick={onClick} className="flex flex-wrap gap-1 cursor-pointer">
      {value.map((val, index) => {
        const option = field.options?.find(opt => opt.value === val);
        return (
          <span 
            key={index}
            className={cn(
              "inline-block text-xs px-2 py-0.5 rounded-full",
              option?.color ? "" : "bg-gray-200 text-gray-800"
            )}
            style={option?.color ? {
              backgroundColor: option.color,
              color: '#fff'
            } : undefined}
          >
            {option?.label || val}
          </span>
        );
      })}
    </div>
  );
};
