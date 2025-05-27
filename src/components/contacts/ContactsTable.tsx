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
import { useContacts, Contact } from '@/contexts/ContactsContext';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { CreateContactForm } from '@/components/contacts/CreateContactForm';
import { TagInput } from '@/components/ui/tag-input';
import { Label } from '@/components/ui/label';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const { isEmailConnected } = useEmail();
  const { deleteContact, updateContact, availableTags } = useContacts();
  const { toast } = useToast();
  
  console.log('ContactsTable render:', { contacts, isLoading, searchQuery });
  
  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
    
    return (
      fullName.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.company?.name && contact.company.name.toLowerCase().includes(query)) ||
      (contact.employment_history?.[0]?.title && contact.employment_history[0].title.toLowerCase().includes(query)) ||
      (contact.phone && contact.phone.toLowerCase().includes(query))
    );
  });
  
  console.log('Filtered contacts:', filteredContacts);
  
  // Handler for deleting a contact
  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      // No need for toast here as it's handled in the ContactsContext
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "There was a problem deleting this contact.",
        variant: "destructive"
      });
    } finally {
      setContactToDelete(null);
      setDeleteDialogOpen(false);
    }
  };
  
  // Handler for bulk deleting selected contacts
  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;
    
    try {
      // Delete each selected contact
      const promises = selectedContacts.map(id => deleteContact(id));
      await Promise.all(promises);
      
      // Show success message
      toast({
        title: "Contacts Deleted",
        description: `Successfully deleted ${selectedContacts.length} contacts.`
      });
      
      // Clear selection
      setSelectedContacts([]);
    } catch (error) {
      console.error("Error bulk deleting contacts:", error);
      toast({
        title: "Error",
        description: "There was a problem deleting the contacts.",
        variant: "destructive"
      });
    }
  };

  // Function to handle tag updates for a single contact
  const handleTagUpdate = async (contactId: string, newTags: string[]) => {
    try {
      await updateContact(contactId, { tags: newTags });
      setEditingTags(null);
      toast({
        title: "Success",
        description: "Tags updated successfully"
      });
    } catch (error) {
      console.error('Failed to update tags:', error);
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive"
      });
    }
  };

  // Function to handle batch tag updates for selected contacts
  const handleBatchTagUpdate = async (newTags: string[]) => {
    try {
      const promises = selectedContacts.map(contactId => 
        updateContact(contactId, { tags: newTags })
      );
      await Promise.all(promises);
      toast({
        title: "Success",
        description: `Tags updated for ${selectedContacts.length} contacts`
      });
    } catch (error) {
      console.error('Failed to update tags:', error);
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive"
      });
    }
  };
  
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
            <TableHead className="w-[250px]">Email</TableHead>
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
                    <div className="font-normal">
                      {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed Contact'}
                    </div>
                    <div className="text-sm text-muted-foreground">Added {new Date(contact.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-muted-foreground text-sm">Not available yet</div>
              </TableCell>
              <TableCell>{contact.company?.name || '-'}</TableCell>
              <TableCell>
                <div className="truncate max-w-[250px]" title={contact.email || ''}>
                  {contact.email || '-'}
                </div>
              </TableCell>
              <TableCell>{contact.phone || '-'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Popover open={editingTags === contact.id} onOpenChange={(open) => setEditingTags(open ? contact.id : null)}>
                    <PopoverTrigger asChild>
                      <div className="flex flex-wrap gap-1 cursor-pointer group">
                        {contact.tags && contact.tags.map((tag, index) => {
                          const colors = [
                            'bg-blue-50 text-blue-700 border-blue-300',
                            'bg-green-50 text-green-700 border-green-300',
                            'bg-purple-50 text-purple-700 border-purple-300',
                            'bg-rose-50 text-rose-700 border-rose-300',
                            'bg-amber-50 text-amber-700 border-amber-300',
                            'bg-teal-50 text-teal-700 border-teal-300'
                          ];
                          const colorIndex = Math.abs(tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
                          
                          return (
                            <Badge 
                              key={index} 
                              variant="outline"
                              className={`px-2 py-0.5 ${colors[colorIndex]} border rounded-md font-medium text-xs hover:bg-opacity-80 transition-colors group-hover:ring-2 ring-offset-1 ring-primary/20`}
                            >
                              {tag}
                            </Badge>
                          );
                        })}
                        {(!contact.tags || contact.tags.length === 0) && (
                          <div className="text-sm text-muted-foreground italic group-hover:text-primary">
                            Click to add tags
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Edit Tags</Label>
                          <TagInput
                            id={`tags-${contact.id}`}
                            tags={contact.tags || []}
                            setTags={(newTags) => handleTagUpdate(contact.id, newTags)}
                            placeholder="Add tags..."
                            availableTags={availableTags}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
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
                      <DropdownMenuItem 
                        onClick={() => {
                          setEditContact(contact);
                          setEditDialogOpen(true);
                        }}
                      >
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
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          setContactToDelete(contact.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
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
      
      {/* Confirmation dialog for deleting a contact */}
      <AlertDialog open={deleteDialogOpen && contactToDelete !== 'bulk'} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContactToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && handleDeleteContact(contactToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirmation dialog for bulk delete */}
      <AlertDialog 
        open={deleteDialogOpen && contactToDelete === 'bulk'} 
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setContactToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedContacts.length} contacts?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected contacts
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContactToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Contact Dialog */}
      <CreateContactForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contact={editContact || undefined}
        mode="edit"
      />
      
      {/* Add batch tag editing when contacts are selected */}
      {selectedContacts.length > 0 && (
        <div className="mt-4 flex items-center gap-4">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => {
              setDeleteDialogOpen(true);
              setContactToDelete('bulk');
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected ({selectedContacts.length})
          </Button>
          
          <div className="flex-1 max-w-md">
            <Label>Edit Tags for Selected Contacts</Label>
            <TagInput
              id="batch-tags"
              tags={[]}
              setTags={handleBatchTagUpdate}
              placeholder="Add tags to selected contacts..."
              availableTags={availableTags}
            />
          </div>
        </div>
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
