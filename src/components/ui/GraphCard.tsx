import { Link } from 'react-router-dom';
import { MoreVertical, Edit, Trash2, Copy, Share } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import type { ServerGraph } from '../../services/api';
import { apiClient } from '../../services/api';

interface GraphCardProps {
  graph: ServerGraph;
  viewMode: 'grid' | 'list';
  onUpdate: () => void;
}

export function GraphCard({ graph, viewMode, onUpdate }: GraphCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const nodeCount = graph.nodes?.length || 0;
  const edgeCount = graph.edges?.length || 0;
  const lastUpdated = formatDistanceToNow(new Date(graph.updated_at), { addSuffix: true });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this graph? This action cannot be undone.')) {
      try {
        await apiClient.deleteGraph(graph.id);
        toast.success('Graph deleted');
        onUpdate();
      } catch (error) {
        console.error('Failed to delete graph:', error);
        toast.error('Failed to delete graph');
      }
    }
  };

  const handleDuplicate = async () => {
    try {
      await apiClient.createGraph({
        title: `${graph.title} (Copy)`,
        description: graph.description,
        nodes: graph.nodes,
        edges: graph.edges,
        metadata: graph.metadata || {},
        is_public: false
      });
      toast.success('Graph duplicated');
      onUpdate();
    } catch (error) {
      console.error('Failed to duplicate graph:', error);
      toast.error('Failed to duplicate graph');
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <Link
                to={`/graph/${graph.id}`}
                className="text-lg font-medium text-gray-900 hover:text-blue-600 truncate"
              >
                {graph.title || 'Untitled Graph'}
              </Link>
              {graph.is_public && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Public
                </span>
              )}
            </div>
            {graph.description && (
              <p className="text-sm text-gray-500 mt-1 truncate">{graph.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
              <span>{nodeCount} nodes</span>
              <span>{edgeCount} edges</span>
              <span>Updated {lastUpdated}</span>
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <Link
                  to={`/graph/${graph.id}`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
                <button
                  onClick={handleDuplicate}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => console.log('Share graph')}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Graph Preview */}
      <Link to={`/graph/${graph.id}`}>
        <div className="aspect-video bg-gray-50 border-b border-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-300">{nodeCount}</div>
              <div className="text-xs text-gray-400">nodes</div>
            </div>
          </div>
          
          {/* Simple graph visualization placeholder */}
          <div className="absolute inset-4">
            <svg className="w-full h-full" viewBox="0 0 200 120">
              {/* Simple node representation */}
              {Array.from({ length: Math.min(nodeCount, 5) }, (_, i) => (
                <circle
                  key={i}
                  cx={40 + (i % 3) * 60}
                  cy={30 + Math.floor(i / 3) * 60}
                  r="8"
                  fill="#3b82f6"
                  opacity="0.6"
                />
              ))}
              {/* Simple edge representation */}
              {edgeCount > 0 && (
                <>
                  <line x1="40" y1="30" x2="100" y2="30" stroke="#6b7280" strokeWidth="1" opacity="0.4" />
                  {edgeCount > 1 && (
                    <line x1="100" y1="30" x2="160" y2="30" stroke="#6b7280" strokeWidth="1" opacity="0.4" />
                  )}
                </>
              )}
            </svg>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link
              to={`/graph/${graph.id}`}
              className="text-lg font-medium text-gray-900 hover:text-blue-600 block truncate"
            >
              {graph.title || 'Untitled Graph'}
            </Link>
            {graph.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{graph.description}</p>
            )}
          </div>
          
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <Link
                  to={`/graph/${graph.id}`}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
                <button
                  onClick={handleDuplicate}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => console.log('Share graph')}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share className="h-4 w-4" />
                  <span>Share</span>
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <span>{nodeCount} nodes</span>
            <span>{edgeCount} edges</span>
          </div>
          <div className="flex items-center space-x-2">
            {graph.is_public && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Public
              </span>
            )}
            <span className="text-xs text-gray-400">{lastUpdated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}