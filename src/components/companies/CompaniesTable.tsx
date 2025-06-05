import { useState, useRef } from 'react';
import { useCompanies, CompanyField } from '@/contexts/CompaniesContext';
import { TableCellRenderer } from '@/components/contacts/cells/TableCellRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { CompanyColumnEditPopover } from './CompanyColumnEditPopover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CompaniesTableProps {
  searchQuery: string;
}

const CompaniesTable: React.FC<CompaniesTableProps> = ({ searchQuery }) => {
  const { companies, fetchCompanies, createCompany, updateCompany, deleteCompany, fields } = useCompanies();
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<any>({});
  const [isColumnEditOpen, setIsColumnEditOpen] = useState(false);
  const [columnEditAnchorEl, setColumnEditAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<CompanyField | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const filteredCompanies = companies.filter(company =>
    Object.values(company).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCreateClick = () => {
    setIsCreating(true);
  };

  const handleCreateCompany = async () => {
    if (newCompanyName.trim() !== '') {
      try {
        await createCompany({ name: newCompanyName, user_id: '' }); // user_id will be set in the context
        setNewCompanyName('');
        setIsCreating(false);
      } catch (error) {
        console.error('Failed to create company:', error);
      }
    }
  };

  const handleEditClick = (id: string) => {
    setEditingCompanyId(id);
    const companyToEdit = companies.find(company => company.id === id);
    setEditedValues(companyToEdit || {});
  };

  const handleValueChange = (field: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async (id: string) => {
    await updateCompany(id, editedValues);
    setEditingCompanyId(null);
  };

  const handleDeleteClick = (id: string) => {
    setCompanyToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (companyToDelete) {
      await deleteCompany(companyToDelete);
      setSelectedCompanies(prev => {
        const newSet = new Set(prev);
        newSet.delete(companyToDelete);
        return newSet;
      });
    }
    setShowDeleteDialog(false);
    setCompanyToDelete(null);
  };

  const handleBulkDeleteClick = () => {
    if (selectedCompanies.size > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = async () => {
    const deletePromises = Array.from(selectedCompanies).map(id => deleteCompany(id));
    await Promise.all(deletePromises);
    setSelectedCompanies(new Set());
    setShowBulkDeleteDialog(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(new Set(filteredCompanies.map(company => company.id)));
    } else {
      setSelectedCompanies(new Set());
    }
  };

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    setSelectedCompanies(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(companyId);
      } else {
        newSet.delete(companyId);
      }
      return newSet;
    });
  };

  const handleColumnEditOpen = (event: React.MouseEvent<HTMLButtonElement>, field: string) => {
    setColumnEditAnchorEl(event.currentTarget);
    const fieldObject = fields.find(f => f.name === field);
    setSelectedColumn(fieldObject || null);
    setIsColumnEditOpen(true);
  };

  const handleColumnEditClose = () => {
    setIsColumnEditOpen(false);
    setColumnEditAnchorEl(null);
    setSelectedColumn(null);
  };

  const handleStartEdit = () => {
    // Logic to handle start edit if needed
  };

  const handleEndEdit = () => {
    // Logic to handle end edit if needed
  };

  const allSelected = filteredCompanies.length > 0 && selectedCompanies.size === filteredCompanies.length;
  const someSelected = selectedCompanies.size > 0 && selectedCompanies.size < filteredCompanies.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateClick}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Company
          </Button>
          {selectedCompanies.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDeleteClick}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedCompanies.size})
            </Button>
          )}
        </div>
        {selectedCompanies.size > 0 && (
          <div className="text-sm text-gray-600">
            {selectedCompanies.size} of {filteredCompanies.length} companies selected
          </div>
        )}
      </div>

      {isCreating && (
        <div className="mb-4 flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Enter company name"
            value={newCompanyName}
            onChange={e => setNewCompanyName(e.target.value)}
          />
          <Button onClick={handleCreateCompany}>Create</Button>
          <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className={someSelected ? 'indeterminate' : ''}
                />
              </th>
              {fields.map(field => (
                <th key={field.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    {field.label}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleColumnEditOpen(e, field.name)}
                      className="ml-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCompanies.map(company => (
              <tr key={company.id} className={selectedCompanies.has(company.id) ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Checkbox
                    checked={selectedCompanies.has(company.id)}
                    onCheckedChange={(checked) => handleSelectCompany(company.id, checked as boolean)}
                  />
                </td>
                {fields.map(field => (
                  <td key={`${company.id}-${field.name}`} className="px-6 py-4 whitespace-nowrap">
                    {editingCompanyId === company.id ? (
                      <TableCellRenderer
                        field={field}
                        value={editedValues[field.name] || ''}
                        row={company}
                        fields={fields}
                        onChange={handleValueChange}
                        isEditable={true}
                        onStartEdit={handleStartEdit}
                        onEndEdit={handleEndEdit}
                        entityType="company"
                      />
                    ) : (
                      <TableCellRenderer
                        field={field}
                        value={company[field.name] || ''}
                        row={company}
                        fields={fields}
                        entityType="company"
                      />
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingCompanyId === company.id ? (
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={() => handleSaveClick(company.id)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingCompanyId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(company.id)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(company.id)}>Delete</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this company? This action cannot be undone.
              All contacts associated with this company will be unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCompanies.size} Companies</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCompanies.size} companies? This action cannot be undone.
              All contacts associated with these companies will be unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CompanyColumnEditPopover
        field={selectedColumn}
      />
    </div>
  );
};

export default CompaniesTable;
