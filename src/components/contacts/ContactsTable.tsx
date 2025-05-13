
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContacts, Contact, ContactField, FieldType } from '@/contexts/ContactsContext';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColumnEditPopover } from './ColumnEditPopover';
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

export const ContactsTable: React.FC = () => {
  const { contacts, visibleFields, updateContact } = useContacts();
  const [editingCell, setEditingCell] = useState<{ contactId: string; fieldId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Helper function to render cell content based on field type
  const renderCellContent = (contact: Contact, field: ContactField) => {
    const value = contact[field.id];
    const isEditing = editingCell?.contactId === contact.id && editingCell?.fieldId === field.id;
    
    // If we're currently editing this cell, show the input
    if (isEditing) {
      return (
        <div className="flex items-center">
          <Input 
            value={editValue} 
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
        </div>
      );
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
            {value.map((tag, i) => (
              <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>
        );
      
      case 'url':
        return value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline"
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

  // Handle cell click to begin editing
  const handleCellClick = (contact: Contact, field: ContactField) => {
    // Don't allow editing of certain types that need special editors
    const nonInlineEditableTypes = ['select', 'multi-select', 'date', 'checkbox', 'files-media'];
    
    if (nonInlineEditableTypes.includes(field.type)) {
      return;
    }
    
    setEditingCell({ contactId: contact.id, fieldId: field.id });
    setEditValue(contact[field.id] || '');
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
                  <PopoverTrigger className="cursor-pointer hover:text-primary flex items-center">
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
            <TableRow key={contact.id} className="cursor-pointer hover:bg-muted/50">
              {visibleFields.map((field) => (
                <TableCell 
                  key={`${contact.id}-${field.id}`}
                  onClick={() => handleCellClick(contact, field)}
                  className={field.type !== 'checkbox' && field.type !== 'select' && field.type !== 'multi-select' ? "cursor-text" : ""}
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
