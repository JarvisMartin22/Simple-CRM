import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEmail } from '@/contexts/EmailContext';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EmailComposer } from './EmailComposer';
import { CalendarCheck, ChevronRight, Eye, Mail, MailCheck, MousePointer, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function EmailTracker() {
  const { emailStats, recentEmails, syncContacts, isSyncing, isEmailConnected, emailAddress } = useEmail();
  const [composeOpen, setComposeOpen] = React.useState(false);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Activity</CardTitle>
            <CardDescription>
              {isEmailConnected ? (
                `Connected as ${emailAddress}`
              ) : (
                'Not connected to email'
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => syncContacts()} 
              disabled={isSyncing || !isEmailConnected}
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Sync</span>
            </Button>
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!isEmailConnected}>
                  <Mail className="h-4 w-4 mr-2" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 w-auto max-w-[800px]">
                <EmailComposer onSent={() => setComposeOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stats">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="stats">
            <div className="grid grid-cols-3 gap-4">
              <StatCard 
                title="Sent" 
                value={emailStats.sent}
                icon={<Mail className="h-8 w-8 text-blue-500" />}
              />
              <StatCard 
                title="Opened" 
                value={emailStats.opened}
                percentage={emailStats.sent ? Math.round((emailStats.opened / emailStats.sent) * 100) : 0}
                icon={<Eye className="h-8 w-8 text-green-500" />}
              />
              <StatCard 
                title="Replied" 
                value={emailStats.replied}
                percentage={emailStats.sent ? Math.round((emailStats.replied / emailStats.sent) * 100) : 0}
                icon={<MailCheck className="h-8 w-8 text-purple-500" />}
              />
            </div>
          </TabsContent>
          <TabsContent value="recent">
            <div className="space-y-4">
              {recentEmails.length > 0 ? (
                recentEmails.map((email) => (
                  <EmailActivityCard key={email.id} email={email} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No email activity yet
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, percentage, icon }: { title: string; value: number; percentage?: number; icon: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-4 flex flex-col items-center text-center">
      {icon}
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
      <p className="text-sm text-gray-500">{title}</p>
      {percentage !== undefined && (
        <Badge variant="outline" className="mt-2">
          {percentage}% rate
        </Badge>
      )}
    </div>
  );
}

function EmailActivityCard({ email }: { email: any }) {
  const getActivityStatus = () => {
    if (email.replied_at) {
      return {
        label: 'Replied',
        icon: <MailCheck className="h-4 w-4 text-purple-500" />,
        time: email.replied_at,
      };
    }
    if (email.opened_at) {
      return {
        label: 'Opened',
        icon: <Eye className="h-4 w-4 text-green-500" />,
        time: email.opened_at,
        count: email.open_count,
      };
    }
    if (email.click_count > 0) {
      return {
        label: 'Clicked',
        icon: <MousePointer className="h-4 w-4 text-blue-500" />,
        time: email.last_clicked_at,
        count: email.click_count,
      };
    }
    return {
      label: 'Sent',
      icon: <Mail className="h-4 w-4 text-gray-500" />,
      time: email.sent_at,
    };
  };

  const activity = getActivityStatus();
  
  return (
    <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-1">
        <div className="font-medium line-clamp-1">{email.subject || 'No subject'}</div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarCheck className="h-3 w-3 mr-1" />
          {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-2 line-clamp-1">
        To: {email.recipient}
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {activity.icon}
          <span className="ml-1 text-sm">
            {activity.label}
            {activity.count && activity.count > 1 ? ` (${activity.count}×)` : ''}
            {activity.time ? ` ${formatDistanceToNow(new Date(activity.time), { addSuffix: true })}` : ''}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 