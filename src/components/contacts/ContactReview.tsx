import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  website: string;
  source: string;
  tags: string[];
  type: 'main' | 'other';
}

interface ContactReviewProps {
  contacts: Contact[];
  selectedContacts: Set<number>;
  onSelectionChange: (index: number) => void;
  onSelectAll: () => void;
  onImport: () => void;
  onCancel: () => void;
  isImporting: boolean;
  stats?: {
    total: number;
    mainContacts: number;
    otherContacts: number;
  };
}

export const ContactReview: React.FC<ContactReviewProps> = ({
  contacts,
  selectedContacts,
  onSelectionChange,
  onSelectAll,
  onImport,
  onCancel,
  isImporting,
  stats
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Review Contacts</CardTitle>
        <CardDescription className="space-y-2">
          <div>
            Select the contacts you want to import
          </div>
          {stats && (
            <div className="flex gap-4 items-center text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Total: {stats.total}</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">Main</Badge>
                <span>{stats.mainContacts}</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">Other</Badge>
                <span>{stats.otherContacts}</span>
              </div>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all"
                checked={selectedContacts.size === contacts.length}
                onClick={onSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All ({selectedContacts.size} of {contacts.length} selected)
              </label>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onCancel} disabled={isImporting}>
                Cancel
              </Button>
              <Button 
                onClick={onImport} 
                disabled={selectedContacts.size === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import Selected (${selectedContacts.size})`
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedContacts.has(index)}
                        onClick={() => onSelectionChange(index)}
                      />
                    </TableCell>
                    <TableCell>
                      {contact.firstName} {contact.lastName}
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      {contact.email ? (
                        <>
                          <Mail className="h-4 w-4 text-gray-400" />
                          {contact.email}
                        </>
                      ) : (
                        <span className="text-gray-400">No email</span>
                      )}
                    </TableCell>
                    <TableCell>{contact.company}</TableCell>
                    <TableCell>{contact.title}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>
                      <Badge variant={contact.type === 'main' ? 'default' : 'secondary'}>
                        {contact.type === 'main' ? 'Main' : 'Other'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}; 