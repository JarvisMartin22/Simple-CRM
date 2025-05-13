
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanies } from '@/contexts/CompaniesContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CompanyColumnEditPopover } from './CompanyColumnEditPopover';
import TableCellRenderer from '../contacts/cells/TableCellRenderer';

export const CompaniesTable: React.FC = () => {
  const { companies, visibleFields, updateCompany } = useCompanies();
  const [editingCell, setEditingCell] = useState<{ companyId: string; fieldId: string } | null>(null);
  
  // Handle cell click to begin editing
  const handleCellClick = (companyId: string, fieldId: string) => {
    setEditingCell({ companyId, fieldId });
  };

  // Handle saving edited value
  const handleSaveEdit = (companyId: string, fieldId: string, value: any) => {
    updateCompany(companyId, fieldId, value);
    setEditingCell(null);
  };

  // Handle cancelling edit
  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleFields.map((field) => (
              <TableHead key={field.id} className="whitespace-nowrap">
                <Popover>
                  <PopoverTrigger className="cursor-pointer hover:text-coral-500 flex items-center">
                    {field.name}
                  </PopoverTrigger>
                  <PopoverContent>
                    <CompanyColumnEditPopover field={field} />
                  </PopoverContent>
                </Popover>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id} className="hover:bg-muted/50">
              {visibleFields.map((field) => {
                const isEditing = 
                  editingCell?.companyId === company.id && 
                  editingCell?.fieldId === field.id;
                
                return (
                  <TableCell 
                    key={`${company.id}-${field.id}`}
                    className="cursor-pointer min-w-[120px] relative"
                  >
                    <TableCellRenderer
                      company={company}
                      field={field}
                      isEditing={isEditing}
                      onSave={(value) => handleSaveEdit(company.id, field.id, value)}
                      onCancel={handleCancelEdit}
                      onClick={() => handleCellClick(company.id, field.id)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
