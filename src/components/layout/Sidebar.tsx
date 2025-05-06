
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Mail, Calendar, Settings } from 'lucide-react';
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
    { name: 'Pipelines', path: '/pipelines', icon: Briefcase },
    { name: 'Campaigns', path: '/campaigns', icon: Mail },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-100 h-screen transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      <div className="flex items-center p-4 border-b border-gray-100">
        {!isCollapsed && (
          <h1 className="text-h3 font-medium text-primary flex items-center">
            Folk CRM
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'ml-auto p-1 text-gray-500 hover:bg-gray-50 rounded-md transition-colors',
            isCollapsed && 'mx-auto'
          )}
        >
          <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1.5 7C1.22386 7 1 7.22386 1 7.5C1 7.77614 1.22386 8 1.5 8H13.5C13.7761 8 14 7.77614 14 7.5C14 7.22386 13.7761 7 13.5 7H1.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </button>
      </div>

      <nav className="mt-6 px-2 flex-1">
        <ul className="space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center py-1.5 px-2 rounded-sm transition-colors text-sm',
                    isActive 
                      ? 'bg-gray-50 text-primary font-medium border-l-2 border-l-primary pl-[calc(0.5rem-2px)]' 
                      : 'hover:bg-gray-50 text-gray-700 border-l-2 border-transparent pl-[calc(0.5rem-2px)]'
                  )}
                >
                  <Icon size={18} className={cn('text-gray-500', isCollapsed ? 'mx-auto' : 'mr-3')} />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-100">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
              <span className="font-medium text-sm">JD</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-500">john@example.com</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-7 h-7 mx-auto rounded-full bg-gray-200 text-gray-700 flex items-center justify-center">
            <span className="font-medium text-sm">JD</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
