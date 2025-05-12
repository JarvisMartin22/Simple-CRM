
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, Phone } from 'lucide-react';

interface ContactDetailProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: number;
    name: string;
    email: string;
    company: string;
    phone?: string;
    lastContact: string;
    avatar?: string;
  };
}

const ContactDetail: React.FC<ContactDetailProps> = ({ isOpen, onClose, contact }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <h3 className="text-xl font-semibold">{contact.name}</h3>
          <p className="text-gray-500">{contact.company}</p>
          
          <div className="w-full mt-6 space-y-4">
            <div className="flex items-center border-b border-gray-100 pb-3">
              <Mail size={16} className="text-gray-400 mr-2" />
              <span className="text-sm">{contact.email}</span>
              <Button size="sm" variant="ghost" className="ml-auto">
                Send Email
              </Button>
            </div>
            
            {contact.phone && (
              <div className="flex items-center border-b border-gray-100 pb-3">
                <Phone size={16} className="text-gray-400 mr-2" />
                <span className="text-sm">{contact.phone}</span>
                <Button size="sm" variant="ghost" className="ml-auto">
                  Call
                </Button>
              </div>
            )}
            
            <div className="flex items-center border-b border-gray-100 pb-3">
              <span className="text-sm font-medium w-32">Last Contact:</span>
              <span className="text-sm">{contact.lastContact}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDetail;
