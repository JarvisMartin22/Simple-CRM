import React, { useState, KeyboardEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { BaseCellProps, ViewCellProps } from './CellTypes';

export const TextCellEdit: React.FC<BaseCellProps> = ({ value, onSave, onCancel }) => {
  // Ensure value is always a string, even if undefined
  const initialValue = value === undefined || value === null ? '' : String(value);
  const [editValue, setEditValue] = useState<string>(initialValue);
  
  console.log("TextCellEdit initialized with:", { value, initialValue, editValue });
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      console.log("Enter pressed, saving:", editValue);
      onSave(editValue);
    } else if (e.key === 'Escape') {
      console.log("Escape pressed, cancelling edit");
      onCancel();
    }
  };
  
  return (
    <div className="flex items-center min-w-[220px] p-1">
      <Input 
        type="text"
        value={editValue} 
        onChange={(e) => {
          console.log("Input changed:", e.target.value);
          setEditValue(e.target.value);
        }}
        className="h-8 w-full"
        autoFocus
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      />
      <button 
        onClick={() => {
          console.log("Save button clicked");
          onSave(editValue);
        }}
        className="ml-2 p-1 bg-green-500 text-white rounded-md"
      >
        <Check size={16} />
      </button>
      <button 
        onClick={() => {
          console.log("Cancel button clicked");
          onCancel();
        }}
        className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const TextCellView: React.FC<ViewCellProps> = ({ value, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    console.log("TextCellView clicked:", value);
    e.stopPropagation();
    onClick();
  };
  
  return (
    <div 
      onClick={handleClick} 
      className="cursor-pointer w-full h-full p-2 hover:bg-gray-50 rounded transition-colors"
    >
      {value || ''}
    </div>
  );
};
