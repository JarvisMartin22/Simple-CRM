import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContacts } from '@/contexts/ContactsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Check, AlertTriangle, Loader2, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useCompanyEnrichment } from '@/hooks/useCompanyEnrichment';

export interface CsvImportProps {
  onClose: () => void;
}

const CsvImport: React.FC<CsvImportProps> = ({ onClose }) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0
  });
  const { createContact } = useContacts();
  const { user } = useAuth();
  const { enrichDomain } = useCompanyEnrichment();

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

    if (!user) {
      toast.error('You must be logged in to import contacts');
      return;
    }

    setIsImporting(true);
    setImportProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0
    });

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const contacts = results.data;
          setImportProgress(prev => ({
            ...prev,
            total: contacts.length
          }));

          for (const row of results.data) {
            try {
              // Type assertion to tell TypeScript that row is an object
              const contactData = row as Record<string, any>;

              // Map CSV fields to contact fields
              const newContact = {
                user_id: user.id,
                first_name: contactData.first_name || contactData.firstName || '',
                last_name: contactData.last_name || contactData.lastName || '',
                email: contactData.email || '',
                phone: contactData.phone || contactData.phoneNumber || '',
                title: contactData.title || contactData.jobTitle || '',
                company_name: contactData.company || contactData.company_name || '',
                website: contactData.website || '',
                notes: contactData.notes || '',
                tags: ['csv-import'],
                source: 'csv'
              };

              // We need at least an email or name
              if ((newContact.first_name || newContact.last_name) || newContact.email) {
                // Use enhanced company enrichment
                let enrichedContact = { ...newContact };
                
                if (newContact.email) {
                  const domain = newContact.email.split('@')[1];
                  if (domain) {
                    const enrichmentResult = await enrichDomain(domain);
                    if (enrichmentResult && !enrichmentResult.is_generic && enrichmentResult.company_name) {
                      enrichedContact.company_name = enrichmentResult.company_name;
                    }
                  }
                }
                
                await createContact(enrichedContact);
                setImportProgress(prev => ({
                  ...prev,
                  processed: prev.processed + 1,
                  successful: prev.successful + 1
                }));
              } else {
                throw new Error('Contact requires either a name or email');
              }
            } catch (error) {
              console.error('Failed to import row:', row, error);
              setImportProgress(prev => ({
                ...prev,
                processed: prev.processed + 1,
                failed: prev.failed + 1
              }));
            }
          }

          // Show completion message
          const { successful, failed, total } = importProgress;
          if (successful > 0) {
            toast.success(`Successfully imported ${successful} contact(s)`);
          }
          if (failed > 0) {
            toast.error(`Failed to import ${failed} contact(s)`);
          }
          
          onClose();
        } catch (error) {
          console.error('CSV parsing error:', error);
          toast.error('Failed to parse CSV file');
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast.error('Failed to read CSV file');
        setIsImporting(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md">
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        <h3 className="text-lg font-medium mb-1">Upload CSV File</h3>
        <p className="text-gray-500 text-sm mb-4 text-center">
          Drag and drop a CSV file here, or click to browse
        </p>
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload"
        />
        <Label htmlFor="csv-upload">
          <Button variant="outline" className="cursor-pointer" asChild>
            <span>Browse Files</span>
          </Button>
        </Label>
        {csvFile && (
          <p className="text-sm text-gray-600 mt-2">
            Selected file: {csvFile.name}
          </p>
        )}
      </div>

      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Importing contacts...</span>
            <span>{importProgress.processed} / {importProgress.total}</span>
          </div>
          <Progress value={(importProgress.processed / importProgress.total) * 100} />
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-md text-sm space-y-2">
        <h4 className="font-medium">CSV Format Requirements:</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>First row should contain column headers</li>
          <li>Required columns: email OR first_name/last_name</li>
          <li>Optional: phone, title, company, website, notes</li>
        </ul>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleImport}
          disabled={!csvFile || isImporting}
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Contacts'
          )}
        </Button>
      </div>
    </div>
  );
};

export default CsvImport;
