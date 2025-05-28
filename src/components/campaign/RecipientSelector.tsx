import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContacts } from '@/hooks/useContacts';
import { Contact } from '@/types/contacts';
import { Filter, Search, Settings, Users, X, Loader2, RefreshCw } from 'lucide-react';

interface RecipientSelectorProps {
  onSelectionChange: (selectedContacts: Contact[]) => void;
  initialSelection?: Contact[];
}

interface FilterCriteria {
  tags?: string[];
  company?: string;
  lastContactedDays?: number;
  hasEmail?: boolean;
}

const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  onSelectionChange,
  initialSelection = [],
}) => {
  const { contacts, loading, error, fetchContacts } = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>(initialSelection);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    hasEmail: true,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch contacts when component mounts
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Get unique companies and tags for filter options
  const companies = [...new Set(contacts.map(contact => contact.company || '').filter(Boolean))];
  const allTags = [...new Set(contacts.flatMap(contact => contact.tags || []))];

  // Filter contacts based on search query and criteria
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch =
      !searchQuery ||
      contact.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters =
      (!filterCriteria.tags?.length ||
        contact.tags?.some(tag => filterCriteria.tags?.includes(tag))) &&
      (!filterCriteria.company || contact.company === filterCriteria.company) &&
      (!filterCriteria.hasEmail || contact.email) &&
      (!filterCriteria.lastContactedDays ||
        (contact.last_contacted &&
          (new Date().getTime() - new Date(contact.last_contacted).getTime()) /
            (1000 * 60 * 60 * 24) <=
            filterCriteria.lastContactedDays));

    return matchesSearch && matchesFilters;
  });

  // Handle selection changes
  const toggleContactSelection = (contact: Contact) => {
    const newSelection = selectedContacts.some(c => c.id === contact.id)
      ? selectedContacts.filter(c => c.id !== contact.id)
      : [...selectedContacts, contact];
    setSelectedContacts(newSelection);
    onSelectionChange(newSelection);
  };

  const toggleAllContacts = () => {
    const newSelection =
      selectedContacts.length === filteredContacts.length ? [] : filteredContacts;
    setSelectedContacts(newSelection);
    onSelectionChange(newSelection);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterCriteria({ hasEmail: true });
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchContacts} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Recipients</SheetTitle>
              <SheetDescription>
                Set criteria to filter your contact list
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Select
                  value={filterCriteria.company}
                  onValueChange={(value) =>
                    setFilterCriteria({ ...filterCriteria, company: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Companies</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        filterCriteria.tags?.includes(tag) ? 'default' : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const tags = filterCriteria.tags || [];
                        setFilterCriteria({
                          ...filterCriteria,
                          tags: tags.includes(tag)
                            ? tags.filter((t) => t !== tag)
                            : [...tags, tag],
                        });
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Last Contacted</label>
                <Select
                  value={filterCriteria.lastContactedDays?.toString()}
                  onValueChange={(value) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      lastContactedDays: value ? parseInt(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any time</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEmail"
                  checked={filterCriteria.hasEmail}
                  onCheckedChange={(checked) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      hasEmail: checked as boolean,
                    })
                  }
                />
                <label
                  htmlFor="hasEmail"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Has email address
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Select Recipients ({selectedContacts.length} selected)
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={
                  selectedContacts.length > 0 &&
                  selectedContacts.length === filteredContacts.length
                }
                onCheckedChange={toggleAllContacts}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedContacts.some((c) => c.id === contact.id)}
                        onCheckedChange={() => toggleContactSelection(contact)}
                      />
                    </TableCell>
                    <TableCell>
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.company}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No contacts found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipientSelector; 