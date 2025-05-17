import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useContacts } from '@/contexts/ContactsContext';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Check, Upload, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Papa from 'papaparse';

interface CsvContact {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  tags?: string;
  notes?: string;
}

interface ImportOptions {
  hasHeaderRow: boolean;
  skipDuplicates: boolean;
  createMissingCompanies: boolean;
}

const CsvImport: React.FC = () => {
  const { toast } = useToast();
  const { addContact } = useContacts();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvContact[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    hasHeaderRow: true,
    skipDuplicates: true,
    createMissingCompanies: true,
  });

  const availableFields = [
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company', label: 'Company' },
    { value: 'title', label: 'Title' },
    { value: 'website', label: 'Website' },
    { value: 'tags', label: 'Tags' },
    { value: 'notes', label: 'Notes' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    // Parse CSV for preview
    Papa.parse(selectedFile, {
      preview: 5, // Preview first 5 rows
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file. Please check the format.');
          return;
        }

        const rows = results.data as string[][];
        
        if (rows.length === 0) {
          setError('CSV file is empty.');
          return;
        }

        // If file has headers, use them for initial mapping
        if (importOptions.hasHeaderRow && rows.length > 1) {
          const headers = rows[0];
          const initialMappings: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            const normalizedHeader = header.toLowerCase().trim();
            
            // Try to match headers with fields
            const matchedField = availableFields.find(field => 
              normalizedHeader.includes(field.value) || 
              field.label.toLowerCase().includes(normalizedHeader)
            );
            
            if (matchedField) {
              initialMappings[index.toString()] = matchedField.value;
            }
          });
          
          setMappings(initialMappings);
          
          // Preview data (skip header)
          const previewData = rows.slice(1, 5).map(row => {
            const contact: Record<string, string> = {};
            
            Object.entries(initialMappings).forEach(([columnIndex, fieldName]) => {
              const index = parseInt(columnIndex);
              if (!isNaN(index) && index < row.length) {
                contact[fieldName] = row[index];
              }
            });
            
            return contact as CsvContact;
          });
          
          setPreview(previewData);
        } else {
          // No headers, just show preview of raw data
          const previewData = rows.slice(0, 5).map(row => {
            return {} as CsvContact;
          });
          
          setPreview(previewData);
        }
      }
    });
  };

  const updateMapping = (columnIndex: string, fieldName: string) => {
    setMappings({
      ...mappings,
      [columnIndex]: fieldName,
    });
  };

  const handleOptionChange = (option: keyof ImportOptions, value: boolean) => {
    setImportOptions({
      ...importOptions,
      [option]: value,
    });
  };

  const importContacts = async () => {
    if (!file) return;

    setIsImporting(true);
    setProgress(0);
    setError(null);

    try {
      // Parse the entire CSV file
      Papa.parse(file, {
        complete: async (results) => {
          const rows = results.data as string[][];
          
          if (rows.length === 0) {
            setError('CSV file is empty.');
            setIsImporting(false);
            return;
          }

          // Skip header row if option is selected
          const dataRows = importOptions.hasHeaderRow ? rows.slice(1) : rows;
          const totalRows = dataRows.length;
          let importedCount = 0;
          let errorCount = 0;
          
          // Process rows
          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            
            try {
              // Map CSV columns to contact fields
              const contact: Record<string, any> = {};
              
              Object.entries(mappings).forEach(([columnIndex, fieldName]) => {
                const index = parseInt(columnIndex);
                if (!isNaN(index) && index < row.length && row[index]?.trim()) {
                  // Handle special fields
                  if (fieldName === 'tags' && row[index]) {
                    // Parse tags from comma-separated string
                    contact.tags = row[index].split(',').map(tag => tag.trim()).filter(Boolean);
                  } else {
                    contact[fieldName] = row[index].trim();
                  }
                }
              });
              
              // Ensure required fields are present
              if (!contact.email) {
                console.warn(`Skipping row ${i} - missing email`);
                errorCount++;
                continue;
              }
              
              // Add the contact with required email field
              await addContact({
                ...contact,
                email: contact.email || '',
              });
              importedCount++;
            } catch (err) {
              console.error(`Error importing row ${i}:`, err);
              errorCount++;
            }
            
            // Update progress
            setProgress(Math.round(((i + 1) / totalRows) * 100));
          }
          
          toast({
            title: "Import complete",
            description: `Imported ${importedCount} contacts with ${errorCount} errors.`,
          });
          
          // Reset state
          setIsImporting(false);
          setFile(null);
          setPreview([]);
          setMappings({});
        },
        error: (error) => {
          setError(`Error parsing CSV: ${error.message}`);
          setIsImporting(false);
        }
      });
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Contacts from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file with contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!file ? (
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
            <Label htmlFor="csv-upload" asChild>
              <Button variant="outline">Browse Files</Button>
            </Label>
            <p className="text-xs text-gray-400 mt-4">
              CSV should include columns for name, email, company, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 p-2 rounded">
                  <Upload className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setMappings({});
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="font-medium">Import Options</h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasHeaderRow" 
                    checked={importOptions.hasHeaderRow} 
                    onCheckedChange={(checked) => 
                      handleOptionChange('hasHeaderRow', checked === true)
                    }
                  />
                  <Label htmlFor="hasHeaderRow">First row contains headers</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skipDuplicates" 
                    checked={importOptions.skipDuplicates} 
                    onCheckedChange={(checked) => 
                      handleOptionChange('skipDuplicates', checked === true)
                    }
                  />
                  <Label htmlFor="skipDuplicates">Skip duplicate email addresses</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="createMissingCompanies" 
                    checked={importOptions.createMissingCompanies} 
                    onCheckedChange={(checked) => 
                      handleOptionChange('createMissingCompanies', checked === true)
                    }
                  />
                  <Label htmlFor="createMissingCompanies">Create companies from company names</Label>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="font-medium">Map Columns</h3>
              <p className="text-sm text-gray-500">
                Match each column in your CSV to the corresponding contact field
              </p>
              
              <div className="grid gap-4">
                {file && preview.length > 0 && (
                  Array.from({ length: Math.max(...preview.map(row => Object.keys(row).length)) }).map((_, colIndex) => (
                    <div key={colIndex} className="flex items-center gap-4">
                      <div className="w-1/3">
                        <select
                          className="w-full border rounded-md px-3 py-2"
                          value={mappings[colIndex.toString()] || ''}
                          onChange={(e) => updateMapping(colIndex.toString(), e.target.value)}
                        >
                          <option value="">Select field</option>
                          {availableFields.map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-2/3 overflow-hidden truncate">
                        <div className="text-sm text-gray-600">
                          {importOptions.hasHeaderRow && preview[0] && colIndex < Object.keys(preview[0]).length
                            ? `Example: ${preview.map(row => Object.values(row)[colIndex]).filter(Boolean).join(', ')}`
                            : `Column ${colIndex + 1}`
                          }
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {file && (
        <CardFooter className="flex justify-between border-t p-4">
          <Button 
            variant="outline" 
            onClick={() => {
              setFile(null);
              setPreview([]);
              setMappings({});
            }}
            disabled={isImporting}
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-4">
            {isImporting && (
              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-[100px]" />
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
            )}
            
            <Button 
              onClick={importContacts} 
              disabled={isImporting || Object.keys(mappings).length === 0}
            >
              {isImporting ? 'Importing...' : 'Import Contacts'}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default CsvImport; 