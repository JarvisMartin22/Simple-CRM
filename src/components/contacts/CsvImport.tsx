import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContacts, Contact } from '@/contexts/ContactsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Check, AlertTriangle, FolderDown } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';

interface CsvImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CsvImport({ open, onOpenChange }: CsvImportProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const { createContact } = useContacts();
  const { user } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setCsvFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsSubmitting(true);
    setParseError(null);
    setImportResults({ success: 0, failed: 0 });

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (!user) {
          toast.error('You must be logged in to import contacts');
          setIsSubmitting(false);
          return;
        }

        let successCount = 0;
        let failedCount = 0;

        for (const row of results.data) {
          try {
            // Type assertion to tell TypeScript that row is an object
            const contactData = row as Record<string, any>;

            // Ensure that first_name and last_name exist, otherwise set them to empty strings
            const firstName = typeof contactData.first_name === 'string' ? contactData.first_name : '';
            const lastName = typeof contactData.last_name === 'string' ? contactData.last_name : '';

            // Check if both first_name and last_name are empty
            if (!firstName && !lastName) {
              console.warn('Skipping row due to missing first_name and last_name', row);
              failedCount++;
              continue; // Skip to the next row
            }

            const newContact: Partial<Contact> = {
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
              email: contactData.email || '',
              phone: contactData.phone || '',
              title: contactData.title || '',
              company_id: contactData.company_id || '',
              website: contactData.website || '',
              notes: contactData.notes || '',
              tags: (contactData.tags || '').split(',').map((tag: string) => tag.trim()).filter(Boolean),
            };

            await createContact(newContact);
            successCount++;
          } catch (error) {
            console.error('Failed to import row:', row, error);
            failedCount++;
          }
        }

        setImportResults({ success: successCount, failed: failedCount });
        toast.success(`Successfully imported ${successCount} contacts`);
        if (failedCount > 0) {
          toast.error(`Failed to import ${failedCount} contacts`);
        }
        setIsSubmitting(false);
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setParseError(error.message);
        setIsSubmitting(false);
        toast.error('Failed to parse CSV file');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="csv" className="text-right">
              CSV File
            </Label>
            <Input type="file" id="csv" accept=".csv" className="col-span-3" onChange={handleFileChange} />
          </div>
          {parseError && (
            <div className="flex items-center text-sm text-red-500 space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <p>{parseError}</p>
            </div>
          )}
          {csvFile && (
            <div className="flex items-center text-sm text-green-500 space-x-2">
              <Check className="h-4 w-4" />
              <p>Selected file: {csvFile.name}</p>
            </div>
          )}
          {importResults.success > 0 && (
            <div className="flex items-center text-sm text-green-500 space-x-2">
              <Check className="h-4 w-4" />
              <p>Successfully imported {importResults.success} contacts.</p>
            </div>
          )}
          {importResults.failed > 0 && (
            <div className="flex items-center text-sm text-red-500 space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <p>Failed to import {importResults.failed} contacts.</p>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={handleImport} disabled={isSubmitting || !csvFile}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">&#9696;</span>
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Contacts
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
