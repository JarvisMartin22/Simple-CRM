import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Eye, MailCheck, Plus, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmail } from '@/contexts/EmailContext';
import { EmailComposer } from './EmailComposer';

interface ContactEmailTabProps {
  contactId: string;
  contactEmail: string;
  contactName: string;
}

export function ContactEmailTab({ contactId, contactEmail, contactName }: ContactEmailTabProps) {
  const { user } = useAuth();
  const { isEmailConnected } = useEmail();
  const [isComposing, setIsComposing] = useState(false);
  
  // Get contact email history
  const { data: emails = [], isLoading, refetch } = useQuery({
    queryKey: ['contact-emails', contactId, contactEmail],
    queryFn: async () => {
      if (!user?.id || !contactEmail) return [];
      
      const { data, error } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('recipient', contactEmail)
        .order('sent_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching email history:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id && !!contactEmail
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Email History</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsComposing(true)}
            disabled={!isEmailConnected}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Email
          </Button>
        </div>
      </div>
      
      {isComposing && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle>New Email</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailComposer 
              prefilledRecipient={contactEmail}
              prefilledSubject={`Re: ${contactName}`}
              contactId={contactId}
              onClose={() => setIsComposing(false)}
              onSent={() => {
                setIsComposing(false);
                refetch();
              }}
              variant="inline"
            />
          </CardContent>
        </Card>
      )}
      
      {isLoading ? (
        <div className="text-center py-10">Loading email history...</div>
      ) : emails.length > 0 ? (
        <div className="space-y-4">
          {emails.map((email) => (
            <EmailHistoryCard key={email.id} email={email} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <Mail className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No email history with this contact</p>
          {isEmailConnected ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => setIsComposing(true)}
            >
              Send your first email
            </Button>
          ) : (
            <p className="text-sm mt-2">Connect your email to start sending</p>
          )}
        </div>
      )}
    </div>
  );
}

function EmailHistoryCard({ email }: { email: any }) {
  const getEmailStatus = () => {
    if (email.replied_at) {
      return {
        icon: <MailCheck className="h-5 w-5 text-purple-500" />,
        label: 'Replied',
        time: formatDistanceToNow(new Date(email.replied_at), { addSuffix: true })
      };
    }
    if (email.opened_at) {
      return {
        icon: <Eye className="h-5 w-5 text-green-500" />,
        label: 'Opened',
        time: formatDistanceToNow(new Date(email.opened_at), { addSuffix: true }),
        count: email.open_count
      };
    }
    return {
      icon: <Mail className="h-5 w-5 text-gray-500" />,
      label: 'Sent',
      time: formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })
    };
  };
  
  const status = getEmailStatus();
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium">{email.subject || 'No subject'}</h3>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Mail className="h-3 w-3 mr-1" />
          <span>Sent to {email.recipient}</span>
        </div>
        
        <Separator className="my-3" />
        
        <div className="flex items-center text-sm">
          {status.icon}
          <div className="ml-2">
            <span className="font-medium">{status.label}</span>
            {status.count && status.count > 1 && (
              <span className="text-gray-500"> ({status.count} times)</span>
            )}
            <span className="text-gray-500"> • {status.time}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 