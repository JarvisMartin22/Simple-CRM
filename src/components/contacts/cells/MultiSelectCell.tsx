
import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X } from "lucide-react";
import { ContactField, SelectOption } from '@/contexts/ContactsContext';
import { BaseCellProps, ViewCellProps } from './CellTypes';

interface MultiSelectCellEditProps extends BaseCellProps {
  field: ContactField;
}

export const MultiSelectCellEdit: React.FC<MultiSelectCellEditProps> = ({ value, field, onSave, onCancel }) => {
  // Ensure we have an array of values
  const initialValues = Array.isArray(value) ? value : value ? [value] : [];
  const [selectedValues, setSelectedValues] = useState<string[]>(initialValues);
  const [newOption, setNewOption] = useState<string>('');
  const newOptionInputRef = useRef<HTMLInputElement>(null);
  
  // Log initial values for debugging
  useEffect(() => {
    console.log("MultiSelectCellEdit initialized with value:", value);
    console.log("Initial selected values:", selectedValues);
  }, []);
  
  const handleNewOptionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newOption.trim()) {
      e.preventDefault();
      
      // Create a new option
      const newOptionValue = newOption.trim();
      const newOptionObj: SelectOption = {
        label: newOptionValue,
        value: newOptionValue.toLowerCase().replace(/\s+/g, '-'),
        color: '#F97316' // Default coral color
      };
      
      // Add to field options if not already present
      if (!field.options?.some(option => option.value === newOptionObj.value)) {
        const updatedOptions = [...(field.options || []), newOptionObj];
        field.options = updatedOptions;
      }
      
      // Add to selected values if not already selected
      if (!selectedValues.includes(newOptionObj.value)) {
        setSelectedValues([...selectedValues, newOptionObj.value]);
        console.log("Added new option to selection:", newOptionObj.value);
      }
      
      // Clear the input
      setNewOption('');
    }
  };
  
  const handleSave = () => {
    console.log("MultiSelectCellEdit saving values:", selectedValues);
    // Always save as an array, even if empty
    onSave(selectedValues);
  };
  
  return (
    <div className="min-w-[220px]">
      <div className="relative">
        <input
          ref={newOptionInputRef}
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyDown={(e) => handleNewOptionKeyDown(e)}
          className="h-8 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-coral-300 w-full"
          placeholder={`Type and press Enter to add...`}
          autoFocus
        />
      </div>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 mb-1">
          {selectedValues.map((value) => {
            const option = field.options?.find((o) => o.value === value);
            return (
              <Badge 
                key={value} 
                variant="secondary" 
                className="flex items-center gap-1"
                style={{ backgroundColor: option?.color || '#F97316', color: 'white' }}
              >
                {option?.label || value}
                <X 
                  size={12}
                  className="cursor-pointer hover:text-coral-100" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedValues(selectedValues.filter(v => v !== value));
                    console.log("Removed from selection:", value);
                  }} 
                />
              </Badge>
            );
          })}
        </div>
      )}
      <div className="mt-1 max-h-[120px] overflow-y-auto">
        {field.options?.map((option) => (
          <div 
            key={option.value} 
            className={`flex items-center p-1.5 rounded-md cursor-pointer mb-1 hover:bg-coral-50 ${selectedValues.includes(option.value) ? 'bg-coral-50' : ''}`}
            onClick={() => {
              const newValues = selectedValues.includes(option.value)
                ? selectedValues.filter(v => v !== option.value)
                : [...selectedValues, option.value];
              setSelectedValues(newValues);
              console.log("Selected values updated:", newValues);
            }}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: option.color }} 
            />
            <span>{option.label}</span>
            {selectedValues.includes(option.value) && (
              <Check size={14} className="ml-auto text-coral-500" />
            )}
          </div>
        ))}
      </div>
      <div className="flex mt-2">
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
  // Log the value in view mode for debugging
  console.log("MultiSelectCellView rendering with value:", value);
  
  if (!Array.isArray(value) || value.length === 0) {
    return <div onClick={onClick} className="cursor-pointer"></div>;
  }
  
  return (
    <div onClick={onClick} className="cursor-pointer">
      <div className="flex flex-wrap gap-1">
        {value.map((tag, i) => {
          const option = field.options?.find(opt => opt.value === tag);
          return (
            <Badge 
              key={i} 
              variant="secondary" 
              style={option ? { backgroundColor: option.color, color: '#fff' } : { backgroundColor: '#F97316', color: '#fff' }}
            >
              {option?.label || tag}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
