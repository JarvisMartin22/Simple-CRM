
import { useState, useRef, useCallback, FormEvent, SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useContacts, Contact } from '@/contexts/ContactsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { FolderDownload, Play, X, UploadCloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CsvImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MappingField {
  csvHeader: string;
  contactField: string;
}

interface ProgressData {
  total: number;
  processed: number;
  successful: number;
  failed: number;
}

export function CsvImport({ open, onOpenChange }: CsvImportProps) {
  const { createContact, fields } = useContacts();
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, any>[]>([]);
  const [mappings, setMappings] = useState<MappingField[]>([]);
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ProgressData>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMappings([]);
    setStep(1);
    setIsUploading(false);
    setIsImporting(false);
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = () => {
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error('The CSV file is empty');
          setIsUploading(false);
          return;
        }

        const headers = Object.keys(results.data[0] as Record<string, any>);

        // Create default mappings based on matching header names
        const defaultMappings: MappingField[] = headers.map(header => {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const matchingField = fields.find(f => 
            f.name.toLowerCase() === normalizedHeader || 
            f.label.toLowerCase() === header.toLowerCase()
          );
          
          return {
            csvHeader: header,
            contactField: matchingField ? matchingField.name : ''
          };
        });

        setCsvHeaders(headers);
        setCsvData(results.data as Record<string, any>[]);
        setMappings(defaultMappings);
        setStep(2);
        setIsUploading(false);
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  const handleUpdateMapping = (index: number, contactField: string) => {
    setMappings(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], contactField };
      return updated;
    });
  };

  const importContacts = async () => {
    if (!user || csvData.length === 0) return;

    setIsImporting(true);
    setProgress({
      total: csvData.length,
      processed: 0,
      successful: 0,
      failed: 0
    });

    const validMappings = mappings.filter(m => m.contactField);

    for (const [index, rowData] of csvData.entries()) {
      try {
        const contactData: Partial<Contact> = { user_id: user.id };
        
        // Apply mappings
        validMappings.forEach(mapping => {
          const value = rowData[mapping.csvHeader];
          if (value !== undefined && value !== null && value !== '') {
            if (mapping.contactField === 'tags' && typeof value === 'string') {
              // Handle tags as array if they are comma-separated
              contactData[mapping.contactField as keyof Contact] = value.split(',').map(tag => tag.trim());
            } else {
              // @ts-ignore - we can't strongly type dynamic fields here
              contactData[mapping.contactField] = value;
            }
          }
        });
        
        // Make sure we have at least an email if first_name and last_name are missing
        if (!contactData.first_name && !contactData.last_name && contactData.email) {
          await createContact({ email: contactData.email, user_id: user.id });
          setProgress(prev => ({
            ...prev,
            processed: prev.processed + 1,
            successful: prev.successful + 1
          }));
        } else if (contactData.first_name || contactData.last_name) {
          // Ensure the contact has required fields
          if (!contactData.first_name) contactData.first_name = '';
          if (!contactData.last_name) contactData.last_name = '';
          
          await createContact(contactData);
          setProgress(prev => ({
            ...prev,
            processed: prev.processed + 1,
            successful: prev.successful + 1
          }));
        } else {
          throw new Error('Contact must have at least a name or email');
        }
      } catch (error) {
        console.error('Error importing contact:', error);
        setProgress(prev => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1
        }));
      }
      
      // Update progress after each contact
      if (index === csvData.length - 1) {
        setStep(3);
        setIsImporting(false);
      }
    }
  };

  const downloadTemplate = () => {
    const headers = fields
      .filter(field => field.visible)
      .map(field => field.name);
    
    const csvContent = [headers.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'contacts_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
              <UploadCloud className="h-12 w-12 text-gray-300 mb-4" />
              <p className="mb-2 text-sm text-gray-500">
                Click to upload or drag and drop your CSV file
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full max-w-xs"
              />
            </div>
            {file && (
              <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                <span className="text-sm font-medium truncate max-w-[300px]">
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={downloadTemplate}>
                <FolderDownload className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <Button 
                onClick={parseCSV} 
                disabled={!file || isUploading}
              >
                {isUploading ? 'Processing...' : 'Next'}
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Map each CSV column to a contact field. Leave unmapped fields blank.
            </p>
            
            <div className="max-h-[300px] overflow-y-auto space-y-3">
              {mappings.map((mapping, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">{mapping.csvHeader}</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {csvData[0][mapping.csvHeader] || '(empty)'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Map to contact field</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={mapping.contactField}
                      onChange={(e) => handleUpdateMapping(index, e.target.value)}
                    >
                      <option value="">-- Do not import --</option>
                      {fields.map(field => (
                        <option key={field.name} value={field.name}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={importContacts} 
                disabled={isImporting || mappings.every(m => !m.contactField)}
              >
                {isImporting ? 'Importing...' : 'Import Contacts'}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Results</CardTitle>
                <CardDescription>
                  Summary of your contact import operation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total contacts:</span>
                    <span className="font-medium">{progress.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successfully imported:</span>
                    <span className="font-medium text-green-600">{progress.successful}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="font-medium text-red-600">{progress.failed}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Progress</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={(progress.processed / progress.total) * 100} />
                    <span className="text-sm font-medium">
                      {Math.round((progress.processed / progress.total) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetState}>
                New Import
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Import your contacts from a CSV file.
          </DialogDescription>
        </DialogHeader>
        
        <Separator />
        
        {renderStepContent()}
        
        {(isUploading || isImporting) && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <Progress 
                value={isImporting ? (progress.processed / progress.total) * 100 : 50} 
                className="w-[200px]" 
              />
              <p className="mt-4 text-sm">
                {isUploading ? 'Processing file...' : `Importing contacts (${progress.processed}/${progress.total})`}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
