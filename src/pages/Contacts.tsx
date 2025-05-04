
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, UserPlus, MoreHorizontal } from 'lucide-react';

const Contacts: React.FC = () => {
  const contacts = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah.johnson@example.com', company: 'Acme Inc', position: 'Marketing Director', tags: ['Client', 'Marketing'] },
    { id: 2, name: 'Michael Brown', email: 'michael.brown@example.com', company: 'TechCorp', position: 'CTO', tags: ['Prospect', 'Tech'] },
    { id: 3, name: 'Emma Davis', email: 'emma.davis@example.com', company: 'Design Studio', position: 'Creative Director', tags: ['Client', 'Design'] },
    { id: 4, name: 'James Wilson', email: 'james.wilson@example.com', company: 'InnoTech', position: 'CEO', tags: ['Lead', 'Executive'] },
    { id: 5, name: 'Olivia Martinez', email: 'olivia.martinez@example.com', company: 'Global Services', position: 'Account Manager', tags: ['Partner'] },
    { id: 6, name: 'William Taylor', email: 'william.taylor@example.com', company: 'Finance Plus', position: 'Financial Advisor', tags: ['Client', 'Finance'] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-h1 font-semibold">Contacts</h1>
        <Button className="bg-primary">
          <UserPlus size={18} className="mr-2" />
          <span>Add Contact</span>
        </Button>
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

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted border-y border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-small">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-small">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-small">Company</th>
                <th className="text-left py-3 px-4 font-semibold text-small">Position</th>
                <th className="text-left py-3 px-4 font-semibold text-small">Tags</th>
                <th className="text-right py-3 px-4 font-semibold text-small">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {contact.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{contact.email}</td>
                  <td className="py-3 px-4">{contact.company}</td>
                  <td className="py-3 px-4 text-muted-foreground">{contact.position}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag, index) => (
                        <span key={index} className="bg-muted px-2 py-1 rounded text-micro">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Contacts;
