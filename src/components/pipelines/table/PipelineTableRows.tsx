
import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Opportunity } from '@/types/pipeline.types';
import { ColumnConfig } from './PipelineTableColumns';

interface PipelineTableRowsProps {
  opportunities: Opportunity[];
  visibleColumns: ColumnConfig[];
  handleEditDeal: (id: string) => void;
  handleDeleteDeal: (id: string) => void;
  getCompanyName: (companyId: string | null) => string;
  getContactName: (contactId: string | null) => string;
  getStageName: (stageId: string) => string;
}

export const PipelineTableRows: React.FC<PipelineTableRowsProps> = ({
  opportunities,
  visibleColumns,
  handleEditDeal,
  handleDeleteDeal,
  getCompanyName,
  getContactName,
  getStageName
}) => {
  const formatCellValue = (opportunity: Opportunity, columnId: string): React.ReactNode => {
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
        const value = opportunity[columnId as keyof Opportunity];
        return value !== undefined && value !== null ? String(value) : 'N/A';
    }
  };

  return (
    <>
      {opportunities.map((opportunity) => (
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
      ))}
    </>
  );
};
