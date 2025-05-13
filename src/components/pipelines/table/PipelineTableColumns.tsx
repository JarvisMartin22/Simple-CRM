
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Opportunity } from '@/types/pipeline.types';

export interface ColumnConfig {
  id: keyof Opportunity | 'company' | 'contact';
  name: string;
  visible: boolean;
}

interface PipelineTableColumnsProps {
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  columnsConfigOpen: boolean;
  setColumnsConfigOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PipelineTableColumns: React.FC<PipelineTableColumnsProps> = ({
  columns,
  setColumns,
  columnsConfigOpen,
  setColumnsConfigOpen
}) => {
  const handleToggleColumn = (columnId: string) => {
    setColumns(prevColumns => 
      prevColumns.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  return (
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
  );
};
