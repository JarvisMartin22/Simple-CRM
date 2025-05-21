import { useState, useEffect, useRef } from 'react';
import { useCompanies } from '@/contexts/CompaniesContext';
import { TableCellRenderer } from '@/components/contacts/cells/TableCellRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, MoreHorizontal } from 'lucide-react';
import { CompanyColumnEditPopover } from './CompanyColumnEditPopover';

const CompaniesTable = () => {
  const { companies, fetchCompanies, createCompany, updateCompany, deleteCompany, fields } = useCompanies();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<any>({});
  const [isColumnEditOpen, setIsColumnEditOpen] = useState(false);
  const [columnEditAnchorEl, setColumnEditAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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
      await createCompany({ name: newCompanyName });
      setNewCompanyName('');
      setIsCreating(false);
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

  const handleDeleteClick = async (id: string) => {
    await deleteCompany(id);
  };

  const handleColumnEditOpen = (event: React.MouseEvent<HTMLButtonElement>, field: string) => {
    setColumnEditAnchorEl(event.currentTarget);
    setSelectedColumn(field);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Input
            type="search"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="mr-2"
          />
          <Search className="h-4 w-4 text-gray-500" />
        </div>
        <Button onClick={handleCreateClick}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {isCreating && (
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Enter company name"
            value={newCompanyName}
            onChange={e => setNewCompanyName(e.target.value)}
            className="mr-2"
          />
          <Button onClick={handleCreateCompany}>Create</Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
              <tr key={company.id}>
                {fields.map(field => (
                  <td key={`${company.id}-${field.name}`} className="px-6 py-4 whitespace-nowrap">
                    {editingCompanyId === company.id ? (
                      <TableCellRenderer
                        field={field.name}
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
                        field={field.name}
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
                    <>
                      <Button size="sm" onClick={() => handleSaveClick(company.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCompanyId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={() => handleEditClick(company.id)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(company.id)}>Delete</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CompanyColumnEditPopover
        open={isColumnEditOpen}
        anchorEl={columnEditAnchorEl}
        onClose={handleColumnEditClose}
        field={selectedColumn}
      />
    </div>
  );
};

export default CompaniesTable;
