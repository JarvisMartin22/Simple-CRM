import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEmail } from '@/contexts/EmailContext';
import { EmailComposer } from '@/components/email/EmailComposer';
import { Mail, MoreHorizontal, Pencil, Trash2, Phone, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  title?: string;
  tags?: string[];
  company_id?: string;
  companies?: {
    name?: string;
    domain?: string;
  };
  created_at: string;
  updated_at: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  isLoading: boolean;
  searchQuery?: string;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({ 
  contacts, 
  isLoading,
  searchQuery = "" 
}) => {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [emailContact, setEmailContact] = useState<{ id: string, email: string, name: string } | null>(null);
  const { isEmailConnected } = useEmail();
  
  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
    
    return (
      fullName.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.companies?.name && contact.companies.name.toLowerCase().includes(query)) ||
      (contact.title && contact.title.toLowerCase().includes(query)) ||
      (contact.phone && contact.phone.toLowerCase().includes(query))
    );
  });
  
  if (isLoading) {
    return <ContactsTableSkeleton />;
  }
  
  if (filteredContacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {searchQuery ? "No contacts found for your search query." : "No contacts found. Add your first contact using the 'Add Contact' button."}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedContacts(filteredContacts.map(contact => contact.id));
                  } else {
                    setSelectedContacts([]);
                  }
                }}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredContacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-muted/50">
              <TableCell>
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
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {contact.first_name?.[0] || contact.email?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact'}</div>
                    <div className="text-sm text-muted-foreground">Added {new Date(contact.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{contact.title || '-'}</TableCell>
              <TableCell>{contact.companies?.name || '-'}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>{contact.phone || '-'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.tags && contact.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="bg-gray-50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {contact.email && isEmailConnected && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEmailContact({
                        id: contact.id,
                        email: contact.email,
                        name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                      })}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit Contact</span>
                      </DropdownMenuItem>
                      {contact.phone && (
                        <DropdownMenuItem>
                          <Phone className="mr-2 h-4 w-4" />
                          <span>Call</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Schedule Meeting</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

const ContactsTableSkeleton = () => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
