import { useAuth } from '../../contexts/AuthContext';
import { UserMenu } from '../auth/UserMenu';
import { useLocation, Link } from 'react-router-dom';
import { Home, FileText } from 'lucide-react';

export function Header() {
  const { user } = useAuth();
  const location = useLocation();

  const isOnGraph = location.pathname.startsWith('/graph/');

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-2 text-gray-900 hover:text-gray-700"
          >
            <Home className="h-5 w-5" />
            <span className="font-semibold">Tribal</span>
          </Link>
          
          {isOnGraph && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>/</span>
              <FileText className="h-4 w-4" />
              <span>Graph Editor</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">Welcome, {user.username}</span>
              <UserMenu />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}