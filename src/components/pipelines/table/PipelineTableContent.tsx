
import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { PipelineTableRows } from './PipelineTableRows';
import { Opportunity } from '@/types/pipeline.types';
import { ColumnConfig } from './PipelineTableColumns';

interface PipelineTableContentProps {
  filteredOpportunities: Opportunity[];
  visibleColumns: ColumnConfig[];
  handleEditDeal: (id: string) => void;
  handleDeleteDeal: (id: string) => void;
  getCompanyName: (companyId: string | null) => string;
  getContactName: (contactId: string | null) => string;
  getStageName: (stageId: string) => string;
}

export const PipelineTableContent: React.FC<PipelineTableContentProps> = ({
  filteredOpportunities,
  visibleColumns,
  handleEditDeal,
  handleDeleteDeal,
  getCompanyName,
  getContactName,
  getStageName
}) => {
  return (
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
            <PipelineTableRows 
              opportunities={filteredOpportunities}
              visibleColumns={visibleColumns}
              handleEditDeal={handleEditDeal}
              handleDeleteDeal={handleDeleteDeal}
              getCompanyName={getCompanyName}
              getContactName={getContactName}
              getStageName={getStageName}
            />
          )}
        </TableBody>
      </Table>
    </div>
  );
};
