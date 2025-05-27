import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  importProgress?: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    skipped: number;
  };
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
  importProgress,
  stats
}) => {
  // Calculate progress percentage
  const progressPercentage = importProgress && importProgress.total > 0
    ? Math.round((importProgress.processed / importProgress.total) * 100)
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Review Contacts</CardTitle>
        <CardDescription className="text-center space-y-2">
          <div>
            Select the contacts you want to import
          </div>
          {stats && (
            <div className="flex gap-4 items-center justify-center text-sm">
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
                disabled={isImporting}
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

          {isImporting && importProgress && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Importing contacts...</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Processed: {importProgress.processed} of {importProgress.total}</span>
                <span className="flex gap-3">
                  <span className="text-green-600">Success: {importProgress.successful}</span>
                  {importProgress.skipped > 0 && (
                    <span className="text-yellow-600">Skipped: {importProgress.skipped}</span>
                  )}
                  {importProgress.failed > 0 && (
                    <span className="text-red-600">Failed: {importProgress.failed}</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[250px]">
                    <div className="truncate">Email</div>
                  </TableHead>
                  <TableHead className="w-[150px]">Company</TableHead>
                  <TableHead className="w-[150px]">Title</TableHead>
                  <TableHead className="w-[120px]">Phone</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Checkbox
                        checked={selectedContacts.has(index)}
                        onCheckedChange={() => onSelectionChange(index)}
                        disabled={isImporting}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[200px]" title={`${contact.firstName} ${contact.lastName}`}>
                        {contact.firstName} {contact.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[250px]" title={contact.email}>
                        {contact.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[150px]" title={contact.company}>
                        {contact.company}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[150px]" title={contact.title}>
                        {contact.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-[120px]" title={contact.phone}>
                        {contact.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contact.type === 'main' ? 'default' : 'secondary'}>
                        {contact.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 