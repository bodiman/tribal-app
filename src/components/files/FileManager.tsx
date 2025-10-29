import React, { useState } from 'react';
import { fileService, type FileUploadResult } from '../../services/files';
import FileUpload from './FileUpload';

interface FileItem extends FileUploadResult {
  id: string;
}

interface FileManagerProps {
  onFileSelect?: (file: FileItem) => void;
  allowMultiple?: boolean;
  showUpload?: boolean;
  className?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({
  onFileSelect,
  allowMultiple = true,
  showUpload = true,
  className = ''
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const handleUploadComplete = (result: FileUploadResult) => {
    const newFile: FileItem = {
      ...result,
      id: result.file.key
    };
    
    setFiles(prev => [newFile, ...prev]);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleFileClick = (file: FileItem) => {
    if (allowMultiple) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(file.id)) {
          newSet.delete(file.id);
        } else {
          newSet.add(file.id);
        }
        return newSet;
      });
    } else {
      setSelectedFiles(new Set([file.id]));
      onFileSelect?.(file);
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.file.filename}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await fileService.deleteFile(file.file.key);
      setFiles(prev => prev.filter(f => f.id !== file.id));
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      const blob = await fileService.downloadFile(file.file.key);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleGetShareableLink = async (file: FileItem) => {
    try {
      const result = await fileService.getSignedUrl(file.file.key, '24h');
      navigator.clipboard.writeText(result.url);
      alert('Shareable link copied to clipboard!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate shareable link');
    }
  };

  const isImage = (contentType: string) => {
    return contentType.startsWith('image/');
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('text')) return '📝';
    if (contentType.includes('zip') || contentType.includes('tar') || contentType.includes('gzip')) return '🗜️';
    if (contentType.includes('json') || contentType.includes('xml')) return '📊';
    return '📁';
  };

  const selectedFilesList = Array.from(selectedFiles).map(id => 
    files.find(f => f.id === id)
  ).filter(Boolean) as FileItem[];

  return (
    <div className={`file-manager ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          File Manager
          {files.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              ({files.length} files)
            </span>
          )}
        </h3>
        
        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="flex border rounded">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1 text-sm ${
                view === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 text-sm ${
                view === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              List
            </button>
          </div>

          {/* Selected files actions */}
          {selectedFiles.size > 0 && (
            <div className="text-sm text-gray-600">
              {selectedFiles.size} selected
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 text-xs underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload section */}
      {showUpload && (
        <div className="mb-6">
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            multiple={true}
            className="w-full"
          />
        </div>
      )}

      {/* Files display */}
      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {showUpload ? 'Upload your first file to get started' : 'No files available'}
        </div>
      ) : (
        <div className={
          view === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-2'
        }>
          {files.map((file) => (
            <div
              key={file.id}
              className={`
                border rounded-lg p-3 cursor-pointer transition-colors
                ${selectedFiles.has(file.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${view === 'list' ? 'flex items-center space-x-4' : ''}
              `}
              onClick={() => handleFileClick(file)}
            >
              {/* File preview/icon */}
              <div className={view === 'list' ? 'flex-shrink-0' : 'mb-3'}>
                {isImage(file.file.content_type) ? (
                  <img
                    src={fileService.getImagePreviewUrl(file.file.key)}
                    alt={file.file.filename}
                    className={`
                      object-cover rounded
                      ${view === 'list' ? 'w-12 h-12' : 'w-full h-32'}
                    `}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={`
                    flex items-center justify-center rounded bg-gray-100
                    ${view === 'list' ? 'w-12 h-12' : 'w-full h-32'}
                  `}>
                    <span className="text-2xl">
                      {getFileIcon(file.file.content_type)}
                    </span>
                  </div>
                )}
              </div>

              {/* File info */}
              <div className={view === 'list' ? 'flex-1 min-w-0' : ''}>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {fileService.formatFileSize(file.file.size)}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(file.file.uploaded_at).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className={`
                flex space-x-1
                ${view === 'list' ? 'flex-shrink-0' : 'mt-2'}
              `}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(file);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 text-xs"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetShareableLink(file);
                  }}
                  className="p-1 text-gray-400 hover:text-green-600 text-xs"
                  title="Copy shareable link"
                >
                  🔗
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 text-xs"
                  title="Delete"
                  disabled={isLoading}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected files summary */}
      {allowMultiple && selectedFilesList.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Selected Files ({selectedFilesList.length})
          </h4>
          <div className="space-y-1">
            {selectedFilesList.map((file) => (
              <p key={file.id} className="text-sm text-gray-600">
                {file.file.filename} ({fileService.formatFileSize(file.file.size)})
              </p>
            ))}
          </div>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => {
                selectedFilesList.forEach(file => onFileSelect?.(file));
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Use Selected
            </button>
            <button
              onClick={() => setSelectedFiles(new Set())}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;