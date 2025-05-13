
import React, { useState, KeyboardEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { BaseCellProps, ViewCellProps } from './CellTypes';

export const UrlCellEdit: React.FC<BaseCellProps> = ({ value, onSave, onCancel }) => {
  const [editValue, setEditValue] = useState<string>(value || '');
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(editValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  return (
    <div className="flex items-center min-w-[220px]">
      <Input 
        type="url"
        value={editValue} 
        onChange={(e) => setEditValue(e.target.value)}
        className="h-8 w-full"
        autoFocus
        onKeyDown={handleKeyDown}
      />
      <button 
        onClick={() => onSave(editValue)}
        className="ml-2 p-1 bg-green-500 text-white rounded-md"
      >
        <Check size={16} />
      </button>
      <button 
        onClick={onCancel}
        className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const UrlCellView: React.FC<ViewCellProps> = ({ value, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      {value ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-coral-500 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      ) : ''}
    </div>
  );
};
