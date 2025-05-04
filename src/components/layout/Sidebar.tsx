
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Search, Users, LayoutDashboard, Calendar, Mail, Settings, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'Pipelines', path: '/pipelines', icon: Layout },
    { name: 'Campaigns', path: '/campaigns', icon: Mail },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 h-screen transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-[70px]' : 'w-[250px]'
      )}
    >
      <div className="flex items-center p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h1 className="text-h3 font-semibold text-primary flex items-center">
            Folk CRM
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn('ml-auto', isCollapsed && 'mx-auto')}
        >
          <Menu size={20} />
        </Button>
      </div>

      <nav className="mt-6 px-3 flex-1">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center py-2 px-3 rounded-md transition-colors',
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  <Icon size={20} className={cn(isCollapsed ? 'mx-auto' : 'mr-3')} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              <span className="font-medium">JD</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-500">john@example.com</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-full bg-primary text-white flex items-center justify-center">
            <span className="font-medium">JD</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
