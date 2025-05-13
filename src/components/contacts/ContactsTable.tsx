
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContacts } from '@/contexts/ContactsContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ColumnEditPopover } from './ColumnEditPopover';
import TableCellRenderer from './cells/TableCellRenderer';

export const ContactsTable: React.FC = () => {
  const { contacts, visibleFields, updateContact } = useContacts();
  const [editingCell, setEditingCell] = useState<{ contactId: string; fieldId: string } | null>(null);
  
  // For debugging
  useEffect(() => {
    console.log("ContactsTable rendered with contacts:", contacts);
    console.log("Visible fields:", visibleFields);
  }, [contacts, visibleFields]);
  
  // Handle cell click to begin editing
  const handleCellClick = (contactId: string, fieldId: string) => {
    console.log("Cell clicked:", { contactId, fieldId });
    setEditingCell({ contactId, fieldId });
  };

  // Handle saving edited value with improved logging
  const handleSaveEdit = (contactId: string, fieldId: string, value: any) => {
    console.log("ContactsTable saving edit:", { contactId, fieldId, value, type: typeof value });
    
    // Get the field definition to determine how to handle the value
    const field = visibleFields.find(f => f.id === fieldId);
    
    if (field) {
      console.log(`Handling save for field type: ${field.type}`);
      
      if (field.type === 'multi-select') {
        // For multi-select fields, ensure we're saving an array
        const arrayValue = Array.isArray(value) ? value : value ? [value] : [];
        console.log("Saving multi-select as array:", arrayValue);
        updateContact(contactId, fieldId, arrayValue);
      } else if (field.type === 'select') {
        // For select fields, store the single value
        console.log("Saving select value:", value);
        updateContact(contactId, fieldId, value);
      } else {
        // Standard field types
        updateContact(contactId, fieldId, value);
      }
    } else {
      console.error("Field not found:", fieldId);
    }
    
    setEditingCell(null);
  };

  // Handle cancelling edit
  const handleCancelEdit = () => {
    console.log("Edit cancelled");
    setEditingCell(null);
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No contacts found. Add your first contact using the "Add Contact" button.
      </div>
    );
  }

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
              {visibleFields.map((field) => {
                const isEditing = 
                  editingCell?.contactId === contact.id && 
                  editingCell?.fieldId === field.id;
                
                return (
                  <TableCell 
                    key={`${contact.id}-${field.id}`}
                    className="cursor-pointer min-w-[120px] relative"
                  >
                    <TableCellRenderer
                      contact={contact}
                      field={field}
                      isEditing={isEditing}
                      onSave={(value) => handleSaveEdit(contact.id, field.id, value)}
                      onCancel={handleCancelEdit}
                      onClick={() => handleCellClick(contact.id, field.id)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
