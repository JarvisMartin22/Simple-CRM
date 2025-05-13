
import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePipelines } from '@/contexts/PipelinesContext';
import { useCompanies } from '@/contexts/CompaniesContext';
import { useContacts } from '@/contexts/ContactsContext';
import { OpportunityForm } from './OpportunityForm';
import { PipelineTableSearch } from './table/PipelineTableSearch';
import { PipelineTableColumns, ColumnConfig } from './table/PipelineTableColumns';
import { PipelineTableContent } from './table/PipelineTableContent';

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

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {/* Search and Filter Section */}
          <PipelineTableSearch 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStage={filterStage}
            setFilterStage={setFilterStage}
            currentPipeline={currentPipeline}
          />
          
          <div className="flex items-center space-x-2">
            {/* Column Configuration */}
            <PipelineTableColumns
              columns={columns}
              setColumns={setColumns}
              columnsConfigOpen={columnsConfigOpen}
              setColumnsConfigOpen={setColumnsConfigOpen}
            />
            
            <Button onClick={handleAddDeal}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Deal
            </Button>
          </div>
        </div>
        
        {/* Table Content */}
        <PipelineTableContent
          filteredOpportunities={filteredOpportunities}
          visibleColumns={visibleColumns}
          handleEditDeal={handleEditDeal}
          handleDeleteDeal={handleDeleteDeal}
          getCompanyName={getCompanyName}
          getContactName={getContactName}
          getStageName={getStageName}
        />
      </div>
      
      {/* Deal Form */}
      <OpportunityForm 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        opportunityId={editingOpportunityId} 
      />
    </>
  );
};
