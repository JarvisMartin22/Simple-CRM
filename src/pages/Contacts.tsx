
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, UserPlus, Settings } from 'lucide-react';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ContactsFieldManager } from '@/components/contacts/ContactsFieldManager';

const Contacts: React.FC = () => {
  const [showFieldManager, setShowFieldManager] = useState(false);

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
          <Button className="bg-primary">
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
              <Input placeholder="Search contacts..." className="pl-10" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center">
              <Filter size={18} className="mr-2" />
              <span>Filter</span>
            </Button>
            <Button variant="outline">Export</Button>
            <Button variant="outline">Import</Button>
          </div>
        </div>

        <ContactsTable />
      </Card>
    </div>
  );
};

export default Contacts;
