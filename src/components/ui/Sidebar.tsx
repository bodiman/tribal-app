import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Plus } from 'lucide-react';
import { useState } from 'react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function SidebarItem({ to, icon, label, isActive }: SidebarItemProps) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 p-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
        >
          <Home className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          <span className="sr-only">Collapse sidebar</span>
          <div className="w-4 h-3 flex flex-col justify-between">
            <div className="h-0.5 bg-gray-400"></div>
            <div className="h-0.5 bg-gray-400"></div>
            <div className="h-0.5 bg-gray-400"></div>
          </div>
        </button>
      </div>

      <nav className="space-y-2">
        <SidebarItem
          to="/dashboard"
          icon={<Home className="h-4 w-4" />}
          label="Dashboard"
          isActive={location.pathname === '/dashboard'}
        />
        
        <SidebarItem
          to="/graph/new"
          icon={<Plus className="h-4 w-4" />}
          label="New Graph"
          isActive={location.pathname === '/graph/new'}
        />
        
        <SidebarItem
          to="/profile"
          icon={<Settings className="h-4 w-4" />}
          label="Profile"
          isActive={location.pathname === '/profile'}
        />
      </nav>

      <div className="mt-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Graphs
        </h3>
        <div className="space-y-1">
          <div className="text-xs text-gray-400 px-3 py-2">
            No recent graphs
          </div>
        </div>
      </div>
    </div>
  );
}