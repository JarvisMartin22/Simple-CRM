import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Building, Settings, Zap } from 'lucide-react';
import CompaniesTable from '@/components/companies/CompaniesTable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CompaniesFieldManager } from '@/components/companies/CompaniesFieldManager';
import { CreateCompanyForm } from '@/components/companies/CreateCompanyForm';
import { CompanyEnrichmentSettings } from '@/components/companies/CompanyEnrichmentSettings';
import { useCompanies } from '@/contexts/CompaniesContext';

const Companies: React.FC = () => {
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { companies, isLoading } = useCompanies();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-h1 font-semibold">Companies</h1>
        <div className="flex space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Zap size={18} className="mr-2" />
                <span>AI Enrichment</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <CompanyEnrichmentSettings />
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Settings size={18} className="mr-2" />
                <span>Properties</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <CompaniesFieldManager />
            </SheetContent>
          </Sheet>
          <Button 
            className="bg-primary"
            onClick={() => setShowAddCompanyModal(true)}
          >
            <Building size={18} className="mr-2" />
            <span>Add Company</span>
          </Button>
        </div>
      </div>

      <Card className="shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center md:w-1/3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search companies..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center">
              <Filter size={18} className="mr-2" />
              <span>Filter</span>
            </Button>
            <Button variant="outline">Export</Button>
            <Button variant="outline">Import</Button>
          </div>
        </div>

        <CompaniesTable searchQuery={searchQuery} />
      </Card>

      {/* Add Company Form Modal */}
      <CreateCompanyForm
        open={showAddCompanyModal}
        onOpenChange={setShowAddCompanyModal}
      />
    </div>
  );
};

export default Companies;
