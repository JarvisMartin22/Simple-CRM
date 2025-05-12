
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, UserPlus } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  email: string;
  company: string;
  lastContact: string;
  avatar?: string;
  phone?: string;
}

interface RecentContactsProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
  onContactAction: (action: 'email' | 'phone', contact: Contact) => void;
  onAddContactClick: () => void;
  onViewAllClick: () => void;
}

const RecentContacts: React.FC<RecentContactsProps> = ({ 
  contacts, 
  onContactClick, 
  onContactAction, 
  onAddContactClick,
  onViewAllClick
}) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Recent Contacts</CardTitle>
            <CardDescription>Recently added or updated</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onAddContactClick}>
            <UserPlus size={16} className="mr-1" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded-md px-2"
              onClick={() => onContactClick(contact)}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{contact.name}</p>
                <p className="text-xs text-gray-500 truncate">{contact.company}</p>
              </div>
              <div className="flex space-x-2">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation();
                  onContactAction('email', contact);
                }}>
                  <Mail size={14} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation();
                  onContactAction('phone', contact);
                }}>
                  <Phone size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="link" className="ml-auto" onClick={onViewAllClick}>View All Contacts</Button>
      </CardFooter>
    </Card>
  );
};

export default RecentContacts;
