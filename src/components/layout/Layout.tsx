
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Layout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-100 py-3 px-4 flex items-center">
          <div className="relative w-64 mr-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-200 text-sm focus:border-gray-300 focus:ring-0"
            />
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors relative">
              <Bell size={18} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
