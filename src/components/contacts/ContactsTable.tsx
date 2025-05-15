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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useEmail } from '@/contexts/EmailContext';
import { EmailComposer } from '@/components/email/EmailComposer';
import { Mail } from 'lucide-react';

export const ContactsTable: React.FC = () => {
  const { contacts, fields, visibleFields, updateContact } = useContacts();
  const [editingCell, setEditingCell] = useState<{ contactId: string; fieldId: string } | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [emailContact, setEmailContact] = useState<{ id: string, email: string, name: string } | null>(null);
  const { isEmailConnected } = useEmail();
  
  // For debugging
  useEffect(() => {
    console.log("ContactsTable rendered with contacts:", contacts);
    console.log("Visible fields:", visibleFields);
  }, [contacts, visibleFields]);
  
  // Handle cell click to begin editing
  const handleCellClick = (contactId: string, fieldId: string) => {
    console.log("Cell clicked:", { contactId, fieldId });
    
    // Get the field to check if it exists
    const field = visibleFields.find(f => f.id === fieldId);
    if (!field) {
      console.error("Field not found in visibleFields:", fieldId);
      return;
    }
    
    // Get the contact to check if it exists
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      console.error("Contact not found:", contactId);
      return;
    }
    
    console.log("Setting editing cell:", { contactId, fieldId, value: contact[fieldId] });
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

  // Find email field
  const emailField = fields.find(field => field.id === 'email' || field.name.toLowerCase() === 'email');
  
  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No contacts found. Add your first contact using the "Add Contact" button.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full caption-bottom">
        <thead className="bg-muted/50">
          <tr>
            <th className="h-12 px-2">
              <Checkbox
                checked={selectedContacts.length === contacts.length && contacts.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedContacts(contacts.map(contact => contact.id));
                  } else {
                    setSelectedContacts([]);
                  }
                }}
              />
            </th>
            {visibleFields.map((field) => (
              <th
                key={field.id}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
              >
                {field.name}
              </th>
            ))}
            <th className="h-12 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-t hover:bg-muted/50">
              <td className="p-2">
                <Checkbox
                  checked={selectedContacts.includes(contact.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedContacts([...selectedContacts, contact.id]);
                    } else {
                      setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                    }
                  }}
                />
              </td>
              {visibleFields.map((field) => (
                <td 
                  key={field.id} 
                  className="p-2"
                  onClick={() => handleCellClick(contact.id, field.id)}
                >
                  <TableCellRenderer
                    contact={contact}
                    field={field}
                    isEditing={editingCell?.contactId === contact.id && editingCell?.fieldId === field.id}
                    onSave={(value) => handleSaveEdit(contact.id, field.id, value)}
                    onCancel={() => setEditingCell(null)}
                    onClick={() => handleCellClick(contact.id, field.id)}
                  />
                </td>
              ))}
              <td className="p-2 text-right">
                {emailField && contact[emailField.id] && isEmailConnected && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEmailContact({
                      id: contact.id,
                      email: contact[emailField.id] as string,
                      name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                    })}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {emailContact && (
        <Dialog open={!!emailContact} onOpenChange={(open) => !open && setEmailContact(null)}>
          <DialogContent className="p-0 max-w-[800px]">
            <EmailComposer 
              prefilledRecipient={emailContact.email}
              prefilledSubject={`Re: ${emailContact.name}`}
              contactId={emailContact.id}
              onClose={() => setEmailContact(null)}
              onSent={() => setEmailContact(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
