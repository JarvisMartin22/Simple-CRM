
import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X, Plus } from "lucide-react";
import { ContactField, SelectOption } from '@/contexts/ContactsContext';
import { BaseCellProps, ViewCellProps } from './CellTypes';

interface SelectCellEditProps extends BaseCellProps {
  field: ContactField;
}

export const SelectCellEdit: React.FC<SelectCellEditProps> = ({ value, field, onSave, onCancel }) => {
  const [editValue, setEditValue] = useState<string>(value || '');
  const [newOption, setNewOption] = useState<string>('');
  const newOptionInputRef = useRef<HTMLInputElement>(null);
  
  // Log the initial value for debugging
  useEffect(() => {
    console.log("SelectCellEdit initialized with value:", value, "type:", typeof value);
  }, [value]);
  
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
      
      // Set the value in the editor
      setEditValue(newOptionObj.value);
      console.log("New option created and selected:", newOptionObj.value);
      
      // Clear the input
      setNewOption('');
    }
  };
  
  const handleSave = () => {
    console.log("SelectCellEdit saving value:", editValue);
    // Only call onSave if a value is selected
    onSave(editValue || null);
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
      <div className="mt-2 max-h-[150px] overflow-y-auto">
        {field.options?.map((option) => (
          <div 
            key={option.value} 
            className={`flex items-center p-1.5 rounded-md cursor-pointer mb-1 hover:bg-coral-50 ${editValue === option.value ? 'bg-coral-50' : ''}`}
            onClick={() => {
              console.log("Selected option:", option.value);
              setEditValue(option.value);
            }}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: option.color }} 
            />
            <span>{option.label}</span>
            {editValue === option.value && (
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

export const SelectCellView: React.FC<ViewCellProps> = ({ value, field, onClick }) => {
  // Log the value in view mode for debugging
  console.log("SelectCellView rendering with value:", value, "type:", typeof value);
  
  if (!value) return <div onClick={onClick} className="cursor-pointer"></div>;
  
  const selectOption = field.options?.find(opt => opt.value === value);
  return (
    <div onClick={onClick} className="cursor-pointer">
      {selectOption ? (
        <Badge 
          style={{ backgroundColor: selectOption.color, color: '#fff' }} 
          variant="default"
        >
          {selectOption.label}
        </Badge>
      ) : value}
    </div>
  );
};
