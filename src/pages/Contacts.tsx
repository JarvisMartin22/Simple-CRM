import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, UserPlus, Settings, Upload } from 'lucide-react';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ContactsFieldManager } from '@/components/contacts/ContactsFieldManager';
import { CreateContactForm } from '@/components/contacts/CreateContactForm';
import SimpleContactImport from '@/components/contacts/SimpleContactImport';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Contacts: React.FC = () => {
  const { user } = useAuth();
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch contacts from Supabase
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching contacts:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-h1 font-semibold">Contacts</h1>
        <div className="flex space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Settings size={18} className="mr-2" />
                <span>Properties</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <ContactsFieldManager />
            </SheetContent>
          </Sheet>
          <Button 
            variant="outline"
            className="flex items-center"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={18} className="mr-2" />
            <span>Import</span>
          </Button>
          <Button 
            className="bg-primary"
            onClick={() => setShowAddContactModal(true)}
          >
            <UserPlus size={18} className="mr-2" />
            <span>Add Contact</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center md:w-1/3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search contacts..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center">
              <Filter size={18} className="mr-2" />
              <span>Filter</span>
            </Button>
            <Button variant="outline">Export</Button>
          </div>
        </div>

        <ContactsTable 
          contacts={contacts || []} 
          isLoading={isLoading} 
          searchQuery={searchQuery}
        />
      </Card>

      {/* Import Contacts Modal - Using simplified component */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>
              Import contacts from Gmail or upload a CSV file
            </DialogDescription>
          </DialogHeader>
          <SimpleContactImport />
        </DialogContent>
      </Dialog>

      {/* Restore original CreateContactForm */}
      <CreateContactForm
        open={showAddContactModal}
        onOpenChange={setShowAddContactModal}
      />
    </div>
  );
};

export default Contacts;
