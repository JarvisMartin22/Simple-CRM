
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus } from 'lucide-react';

const Pipelines: React.FC = () => {
  const pipelines = [
    { id: 'sales', name: 'Sales Pipeline' },
    { id: 'recruitment', name: 'Recruitment Pipeline' },
  ];
  
  const stages = [
    { id: 'lead', name: 'Lead', count: 5 },
    { id: 'contact', name: 'Contact Made', count: 3 },
    { id: 'meeting', name: 'Meeting Scheduled', count: 2 },
    { id: 'proposal', name: 'Proposal', count: 4 },
    { id: 'negotiation', name: 'Negotiation', count: 2 },
    { id: 'closed', name: 'Closed Won', count: 3 },
  ];

  const deals = [
    { id: 1, name: 'TechCorp Website Redesign', company: 'TechCorp', value: '$12,000', stage: 'lead', owner: 'JD', age: 3, priority: 'high' },
    { id: 2, name: 'Acme Inc Software License', company: 'Acme Inc', value: '$24,500', stage: 'lead', owner: 'JD', age: 5, priority: 'medium' },
    { id: 3, name: 'InnoTech Consulting Project', company: 'InnoTech', value: '$8,750', stage: 'lead', owner: 'JD', age: 2, priority: 'low' },
    { id: 4, name: 'Global Services Partnership', company: 'Global Services', value: '$30,000', stage: 'lead', owner: 'JD', age: 7, priority: 'high' },
    { id: 5, name: 'Design Studio Branding', company: 'Design Studio', value: '$15,500', stage: 'lead', owner: 'JD', age: 1, priority: 'medium' },
    
    { id: 6, name: 'Finance Plus Integration', company: 'Finance Plus', value: '$18,000', stage: 'contact', owner: 'JD', age: 4, priority: 'medium' },
    { id: 7, name: 'Startup Growth Plan', company: 'New Ventures', value: '$9,200', stage: 'contact', owner: 'JD', age: 6, priority: 'low' },
    { id: 8, name: 'Enterprise Security Audit', company: 'SecureCorp', value: '$42,000', stage: 'contact', owner: 'JD', age: 2, priority: 'high' },
    
    { id: 9, name: 'Data Migration Project', company: 'DataFlow', value: '$16,500', stage: 'meeting', owner: 'JD', age: 3, priority: 'medium' },
    { id: 10, name: 'Annual IT Support', company: 'TechHelp', value: '$36,000', stage: 'meeting', owner: 'JD', age: 5, priority: 'medium' },
    
    { id: 11, name: 'Marketing Campaign', company: 'BrandBoosters', value: '$22,000', stage: 'proposal', owner: 'JD', age: 8, priority: 'high' },
    { id: 12, name: 'HR Software Implementation', company: 'PeopleFirst', value: '$28,500', stage: 'proposal', owner: 'JD', age: 4, priority: 'medium' },
    { id: 13, name: 'Supply Chain Optimization', company: 'LogisticsPlus', value: '$19,800', stage: 'proposal', owner: 'JD', age: 6, priority: 'low' },
    { id: 14, name: 'Mobile App Development', company: 'AppWorks', value: '$45,000', stage: 'proposal', owner: 'JD', age: 2, priority: 'high' },
    
    { id: 15, name: 'Cloud Migration Strategy', company: 'CloudNine', value: '$32,000', stage: 'negotiation', owner: 'JD', age: 7, priority: 'high' },
    { id: 16, name: 'Sales Training Program', company: 'SalesBoost', value: '$14,500', stage: 'negotiation', owner: 'JD', age: 4, priority: 'medium' },
    
    { id: 17, name: 'Network Infrastructure', company: 'ConnectTech', value: '$78,000', stage: 'closed', owner: 'JD', age: 14, priority: 'high' },
    { id: 18, name: 'Customer Research Project', company: 'InsightCorp', value: '$26,500', stage: 'closed', owner: 'JD', age: 10, priority: 'medium' },
    { id: 19, name: 'Website Maintenance', company: 'WebCare', value: '$12,000', stage: 'closed', owner: 'JD', age: 5, priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-h1 font-semibold">Pipelines</h1>
          <div className="mt-2">
            <Button variant="outline" className="flex items-center">
              <span className="mr-1">Sales Pipeline</span>
              <ChevronDown size={16} />
            </Button>
          </div>
        </div>
        <Button className="bg-primary">
          <Plus size={18} className="mr-2" />
          <span>Add Deal</span>
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex space-x-5">
          {stages.map((stage) => {
            const stageDeals = deals.filter((deal) => deal.stage === stage.id);
            
            return (
              <div key={stage.id} className="kanban-column">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">{stage.name}</h3>
                    <span className="text-sm text-muted-foreground">{stageDeals.length} deals</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus size={16} />
                  </Button>
                </div>
                
                <div className="flex-1">
                  {stageDeals.map((deal) => (
                    <div key={deal.id} className="kanban-card animate-fade-in">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{deal.name}</h4>
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                          {deal.owner}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-small mt-1">{deal.company}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="font-medium">{deal.value}</span>
                        <span className={`px-2 py-1 rounded text-micro ${
                          deal.priority === 'high' ? 'bg-danger/10 text-danger' :
                          deal.priority === 'medium' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        }`}>
                          {deal.priority}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {deal.age} days in stage
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Pipelines;
