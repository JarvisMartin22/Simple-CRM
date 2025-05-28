import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { RecipientAnalytics } from '../../../types/analytics';

interface RecipientTableProps {
  recipients: RecipientAnalytics[];
}

export const RecipientTable: React.FC<RecipientTableProps> = ({ recipients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch = recipient.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'all') return matchesSearch;
    
    switch (filterStatus) {
      case 'opened':
        return matchesSearch && recipient.open_count > 0;
      case 'clicked':
        return matchesSearch && recipient.click_count > 0;
      case 'bounced':
        return matchesSearch && recipient.bounced_at !== null;
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Recipients</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opens</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>First Opened</TableHead>
              <TableHead>Last Clicked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecipients.map((recipient) => (
              <TableRow key={recipient.id}>
                <TableCell>{recipient.email}</TableCell>
                <TableCell>
                  {recipient.bounced_at
                    ? 'Bounced'
                    : recipient.click_count > 0
                    ? 'Clicked'
                    : recipient.open_count > 0
                    ? 'Opened'
                    : 'Sent'}
                </TableCell>
                <TableCell>{recipient.open_count}</TableCell>
                <TableCell>{recipient.click_count}</TableCell>
                <TableCell>
                  {recipient.first_opened_at
                    ? format(new Date(recipient.first_opened_at), 'PPp')
                    : '-'}
                </TableCell>
                <TableCell>
                  {recipient.last_clicked_at
                    ? format(new Date(recipient.last_clicked_at), 'PPp')
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 