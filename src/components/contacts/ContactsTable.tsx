
import React, { useState, useRef, KeyboardEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContacts, Contact, ContactField, FieldType, SelectOption } from '@/contexts/ContactsContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColumnEditPopover } from './ColumnEditPopover';
import { Input } from "@/components/ui/input";
import { Check, Calendar as CalendarIcon, X, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ContactsTable: React.FC = () => {
  const { contacts, visibleFields, updateContact, updateField } = useContacts();
  const [editingCell, setEditingCell] = useState<{ contactId: string; fieldId: string } | null>(null);
  const [editValue, setEditValue] = useState<string | string[] | boolean | Date | null>('');
  const [newOption, setNewOption] = useState<string>('');
  const newOptionInputRef = useRef<HTMLInputElement>(null);
  
  // Helper function to render cell content based on field type
  const renderCellContent = (contact: Contact, field: ContactField) => {
    const value = contact[field.id];
    const isEditing = editingCell?.contactId === contact.id && editingCell?.fieldId === field.id;
    
    // If we're currently editing this cell
    if (isEditing) {
      // Handle different field types
      switch (field.type) {
        case 'text':
        case 'url':
        case 'email':
        case 'phone':
        case 'number':
          return (
            <div className="flex items-center min-w-[220px]">
              <Input 
                type={field.type === 'number' ? 'number' : 'text'}
                value={editValue as string || ''} 
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit(contact.id, field.id);
                  } else if (e.key === 'Escape') {
                    setEditingCell(null);
                  }
                }}
              />
              <button 
                onClick={() => handleSaveEdit(contact.id, field.id)}
                className="ml-2 p-1 bg-green-500 text-white rounded-md"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => setEditingCell(null)}
                className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          );
        
        case 'date':
          return (
            <div className="flex flex-col min-w-[220px]">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center h-8 px-3 border rounded-md bg-white justify-between w-full">
                    {editValue ? format(editValue as Date, 'PP') : 'Select date'}
                    <CalendarIcon className="ml-2 h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 min-w-[250px]">
                  <Calendar
                    mode="single"
                    selected={editValue as Date || undefined}
                    onSelect={(date) => {
                      setEditValue(date);
                      if (date) {
                        setTimeout(() => handleSaveEdit(contact.id, field.id), 100);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <div className="flex mt-1">
                <button 
                  onClick={() => handleSaveEdit(contact.id, field.id)}
                  className="p-1 bg-green-500 text-white rounded-md text-xs"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setEditingCell(null)}
                  className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        
        case 'checkbox':
          return (
            <div className="flex items-center min-w-[220px]">
              <Checkbox 
                checked={Boolean(editValue)} 
                onCheckedChange={(checked) => {
                  setEditValue(Boolean(checked));
                  setTimeout(() => handleSaveEdit(contact.id, field.id), 100);
                }}
              />
              <div className="flex ml-2">
                <button 
                  onClick={() => handleSaveEdit(contact.id, field.id)}
                  className="p-1 bg-green-500 text-white rounded-md text-xs"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setEditingCell(null)}
                  className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        
        case 'select':
          return (
            <div className="min-w-[220px]">
              <div className="relative">
                <input
                  ref={newOptionInputRef}
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => handleNewOptionKeyDown(e, field, 'select')}
                  className="h-8 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-coral-300 w-full"
                  placeholder={`Type and press Enter to add...`}
                />
              </div>
              <div className="mt-2 max-h-[150px] overflow-y-auto">
                {field.options?.map((option) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center p-1.5 rounded-md cursor-pointer mb-1 hover:bg-coral-50 ${(editValue as string) === option.value ? 'bg-coral-50' : ''}`}
                    onClick={() => {
                      setEditValue(option.value);
                      setTimeout(() => handleSaveEdit(contact.id, field.id), 100);
                    }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: option.color }} 
                    />
                    <span>{option.label}</span>
                    {(editValue as string) === option.value && (
                      <Check size={14} className="ml-auto text-coral-500" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex mt-2">
                <button 
                  onClick={() => handleSaveEdit(contact.id, field.id)}
                  className="p-1 bg-coral-500 text-white rounded-md text-xs"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setEditingCell(null)}
                  className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
          
        case 'multi-select':
          const selectedValues = (editValue as string[]) || [];
          return (
            <div className="min-w-[220px]">
              <div className="relative">
                <input
                  ref={newOptionInputRef}
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => handleNewOptionKeyDown(e, field, 'multi-select')}
                  className="h-8 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-coral-300 w-full"
                  placeholder={`Type and press Enter to add...`}
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
                            const newValues = selectedValues.filter(v => v !== value);
                            setEditValue(newValues);
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
                      setEditValue(newValues);
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
                  onClick={() => handleSaveEdit(contact.id, field.id)}
                  className="p-1 bg-coral-500 text-white rounded-md text-xs"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setEditingCell(null)}
                  className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md text-xs"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
          
        default:
          return (
            <div className="flex items-center">
              <Input 
                value={String(editValue || '')} 
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8 w-full min-w-[220px]"
                autoFocus
              />
              <button 
                onClick={() => handleSaveEdit(contact.id, field.id)}
                className="ml-2 p-1 bg-green-500 text-white rounded-md"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => setEditingCell(null)}
                className="ml-1 p-1 bg-gray-300 text-gray-700 rounded-md"
              >
                <X size={16} />
              </button>
            </div>
          );
      }
    }
    
    if (value === undefined || value === null) {
      return '';
    }

    switch (field.type) {
      case 'date':
        return value ? format(new Date(value), 'PP') : '';
      
      case 'select':
        if (!value) return '';
        const selectOption = field.options?.find(opt => opt.value === value);
        return selectOption ? (
          <Badge 
            style={{ backgroundColor: selectOption.color, color: '#fff' }} 
            variant="default"
          >
            {selectOption.label}
          </Badge>
        ) : value;
      
      case 'multi-select':
        if (!Array.isArray(value) || value.length === 0) return '';
        return (
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
        );
      
      case 'url':
        return value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-coral-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        ) : '';
      
      case 'checkbox':
        return value ? '✓' : '';
        
      default:
        return value;
    }
  };

  // Handle new option key down for select and multi-select
  const handleNewOptionKeyDown = (e: KeyboardEvent<HTMLInputElement>, field: ContactField, type: 'select' | 'multi-select') => {
    if (e.key === 'Enter' && newOption.trim()) {
      e.preventDefault();
      
      // Create a new option
      const newOptionValue = newOption.trim();
      const newOptionObj: SelectOption = {
        label: newOptionValue,
        value: newOptionValue.toLowerCase().replace(/\s+/g, '-'),
        color: '#F97316' // Default coral color
      };
      
      // Add to field options
      const updatedOptions = [...(field.options || []), newOptionObj];
      updateField(field.id, { options: updatedOptions });
      
      // Set the value in the editor
      if (type === 'select') {
        setEditValue(newOptionObj.value);
      } else if (type === 'multi-select') {
        const currentValues = Array.isArray(editValue) ? editValue : [];
        setEditValue([...currentValues, newOptionObj.value]);
      }
      
      // Clear the input
      setNewOption('');
    }
  };

  // Handle cell click to begin editing
  const handleCellClick = (contact: Contact, field: ContactField) => {
    setEditingCell({ contactId: contact.id, fieldId: field.id });
    setNewOption('');
    
    // Initialize edit value based on field type
    let initialValue;
    switch (field.type) {
      case 'checkbox':
        initialValue = Boolean(contact[field.id]);
        break;
      case 'date':
        initialValue = contact[field.id] ? new Date(contact[field.id]) : new Date();
        break;
      case 'multi-select':
        initialValue = Array.isArray(contact[field.id]) ? contact[field.id] : [];
        break;
      default:
        initialValue = contact[field.id] || '';
    }
    
    setEditValue(initialValue);
    
    // Focus new option input if it's a select or multi-select
    setTimeout(() => {
      if (field.type === 'select' || field.type === 'multi-select') {
        newOptionInputRef.current?.focus();
      }
    }, 100);
  };

  // Handle saving edited value
  const handleSaveEdit = (contactId: string, fieldId: string) => {
    updateContact(contactId, fieldId, editValue);
    setEditingCell(null);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleFields.map((field) => (
              <TableHead key={field.id} className="whitespace-nowrap">
                <Popover>
                  <PopoverTrigger className="cursor-pointer hover:text-coral-500 flex items-center">
                    {field.name}
                  </PopoverTrigger>
                  <PopoverContent>
                    <ColumnEditPopover field={field} />
                  </PopoverContent>
                </Popover>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-muted/50">
              {visibleFields.map((field) => (
                <TableCell 
                  key={`${contact.id}-${field.id}`}
                  onClick={() => handleCellClick(contact, field)}
                  className="cursor-pointer min-w-[120px] relative"
                >
                  {renderCellContent(contact, field)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
