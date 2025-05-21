
import { useState } from 'react';
import { useContacts, Contact } from '@/contexts/ContactsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export interface SimpleContactImportProps {
  onClose: () => void;
}

export function SimpleContactImport({ onClose }: SimpleContactImportProps) {
  const { createContact } = useContacts();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [contactsData, setContactsData] = useState('');
  const [results, setResults] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
  });
  const [showResults, setShowResults] = useState(false);

  const parseContactsFromText = (text: string) => {
    // Split by new line
    const lines = text.trim().split('\n');
    
    const contacts = lines.map(line => {
      // Try to identify the format (email, "First Last <email>", etc.)
      const nameEmailMatch = line.match(/^"?([^"<]+)"?\s*<?([^>]+)?>?$/);
      
      if (nameEmailMatch) {
        const fullName = nameEmailMatch[1].trim();
        const email = nameEmailMatch[2].trim();
        
        // Try to split name into first and last
        const nameParts = fullName.split(' ');
        let firstName = '';
        let lastName = '';
        
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else {
          firstName = fullName;
        }
        
        return {
          first_name: firstName,
          last_name: lastName,
          email,
          title: '',
          tags: []
        };
      } else {
        // Just treat it as an email if we can't parse
        return {
          first_name: '',
          last_name: '',
          email: line.trim(),
          title: '',
          tags: []
        };
      }
    }).filter(contact => contact.email); // Only keep entries with email
    
    return contacts;
  };

  const importContacts = async () => {
    if (!user || !contactsData.trim()) return;
    
    const contacts = parseContactsFromText(contactsData);
    
    if (contacts.length === 0) {
      toast.error('No valid contact data found');
      return;
    }
    
    setIsImporting(true);
    setResults({
      total: contacts.length,
      processed: 0,
      successful: 0,
      failed: 0
    });
    
    try {
      for (const contact of contacts) {
        try {
          await createContact({
            ...contact,
            user_id: user.id
          });
          
          setResults(prev => ({
            ...prev,
            processed: prev.processed + 1,
            successful: prev.successful + 1
          }));
        } catch (error) {
          console.error('Failed to import contact:', error);
          setResults(prev => ({
            ...prev,
            processed: prev.processed + 1,
            failed: prev.failed + 1
          }));
        }
      }
      
      toast.success(`${results.successful} contacts imported successfully`);
      setShowResults(true);
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Quick Contact Import</CardTitle>
        <CardDescription>
          Paste a list of contacts (one per line) to quickly import them.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!showResults ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactsData">Paste Contacts</Label>
              <Textarea 
                id="contactsData"
                value={contactsData}
                onChange={(e) => setContactsData(e.target.value)}
                placeholder="John Doe <john@example.com>&#10;jane@example.com&#10;Alice Smith <alice@example.com>"
                className="min-h-[200px]"
              />
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Format Tips:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>One contact per line</li>
                <li>Simple email: alice@example.com</li>
                <li>With name: John Doe &lt;john@example.com&gt;</li>
                <li>With name in quotes: "Jane Smith" &lt;jane@example.com&gt;</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="font-medium text-green-700 mb-2">Import Complete</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total contacts:</span>
                  <span className="font-medium">{results.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Successfully imported:</span>
                  <span className="font-medium text-green-600">{results.successful}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-medium text-red-600">{results.failed}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          {showResults ? 'Close' : 'Cancel'}
        </Button>
        
        {!showResults && (
          <Button 
            onClick={importContacts} 
            disabled={isImporting || !contactsData.trim()}
          >
            {isImporting ? 'Importing...' : 'Import Contacts'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
