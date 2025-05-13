
import React, { useState } from 'react';
import { MoreHorizontal, Edit, Trash, Filter, Search, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Toggle } from '@/components/ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { usePipelines, Opportunity } from '@/contexts/PipelinesContext';
import { useCompanies } from '@/contexts/CompaniesContext';
import { useContacts } from '@/contexts/ContactsContext';
import { OpportunityForm } from './OpportunityForm';
import { cn } from '@/lib/utils';

interface ColumnConfig {
  id: keyof Opportunity | 'company' | 'contact';
  name: string;
  visible: boolean;
}

export const PipelineTableView: React.FC = () => {
  const { currentPipeline, opportunities, deleteOpportunity } = usePipelines();
  const { companies } = useCompanies();
  const { contacts } = useContacts();
  const [formOpen, setFormOpen] = useState(false);
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('');
  const [columnsConfigOpen, setColumnsConfigOpen] = useState(false);
  
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'name', name: 'Opportunity', visible: true },
    { id: 'stage', name: 'Stage', visible: true },
    { id: 'value', name: 'Value', visible: true },
    { id: 'probability', name: 'Probability', visible: true },
    { id: 'expected_close_date', name: 'Expected Close Date', visible: true },
    { id: 'company', name: 'Company', visible: true },
    { id: 'contact', name: 'Contact', visible: true },
    { id: 'details', name: 'Details', visible: false },
    { id: 'created_at', name: 'Created Date', visible: false },
    { id: 'updated_at', name: 'Updated Date', visible: false },
  ]);

  const handleAddDeal = () => {
    setEditingOpportunityId(undefined);
    setFormOpen(true);
  };

  const handleEditDeal = (opportunityId: string) => {
    setEditingOpportunityId(opportunityId);
    setFormOpen(true);
  };

  const handleDeleteDeal = async (opportunityId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      await deleteOpportunity(opportunityId);
    }
  };

  const handleToggleColumn = (columnId: string) => {
    setColumns(prevColumns => 
      prevColumns.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterStage || opportunity.stage === filterStage;
    return matchesSearch && matchesFilter;
  });

  const visibleColumns = columns.filter(col => col.visible);
  
  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return 'N/A';
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unknown';
  };
  
  const getContactName = (contactId: string | null) => {
    if (!contactId) return 'N/A';
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
  };
  
  const getStageName = (stageId: string) => {
    const stage = currentPipeline?.stages.find(s => s.id === stageId);
    return stage ? stage.name : stageId;
  };

  const formatCellValue = (opportunity: Opportunity, columnId: string) => {
    switch(columnId) {
      case 'stage':
        return getStageName(opportunity.stage);
      case 'value':
        return opportunity.value ? `$${opportunity.value.toLocaleString()}` : 'N/A';
      case 'probability':
        return opportunity.probability !== null ? `${opportunity.probability}%` : 'N/A';
      case 'expected_close_date':
        return opportunity.expected_close_date 
          ? format(new Date(opportunity.expected_close_date), 'MMM d, yyyy')
          : 'N/A';
      case 'company':
        return getCompanyName(opportunity.company_id);
      case 'contact':
        return getContactName(opportunity.contact_id);
      case 'created_at':
        return format(new Date(opportunity.created_at), 'MMM d, yyyy');
      case 'updated_at':
        return format(new Date(opportunity.updated_at), 'MMM d, yyyy');
      default:
        return opportunity[columnId as keyof Opportunity] || 'N/A';
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-2">
                  <h4 className="font-medium mb-2">Filter by Stage</h4>
                  <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Stages</SelectItem>
                      {currentPipeline?.stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center space-x-2">
            <Sheet open={columnsConfigOpen} onOpenChange={setColumnsConfigOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">Edit Columns</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Customize Columns</SheetTitle>
                </SheetHeader>
                <div className="py-6">
                  <div className="space-y-4">
                    {columns.map((column) => (
                      <div key={String(column.id)} className="flex items-center justify-between">
                        <span>{column.name}</span>
                        <Toggle
                          pressed={column.visible}
                          onPressedChange={() => handleToggleColumn(String(column.id))}
                          disabled={column.id === 'name'} // Name column is required
                        >
                          {column.visible ? 'Visible' : 'Hidden'}
                        </Toggle>
                      </div>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <Button onClick={handleAddDeal}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Deal
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead key={String(column.id)}>
                    {column.name}
                  </TableHead>
                ))}
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                    No deals found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOpportunities.map((opportunity) => (
                  <TableRow key={opportunity.id}>
                    {visibleColumns.map((column) => (
                      <TableCell key={`${opportunity.id}-${String(column.id)}`}>
                        {column.id === 'name' ? (
                          <div className="font-medium">{opportunity.name}</div>
                        ) : column.id === 'stage' ? (
                          <Badge variant="outline" className={cn(
                            "bg-gray-50",
                            opportunity.stage === 'closed' && opportunity.probability === 100 && "bg-green-50 text-green-700",
                            opportunity.stage === 'closed' && opportunity.probability === 0 && "bg-red-50 text-red-700"
                          )}>
                            {formatCellValue(opportunity, String(column.id))}
                          </Badge>
                        ) : (
                          formatCellValue(opportunity, String(column.id))
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDeal(opportunity.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteDeal(opportunity.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <OpportunityForm 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        opportunityId={editingOpportunityId} 
      />
    </>
  );
};
