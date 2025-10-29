import React, { useState } from 'react';
import { FileManager, FileUpload } from './index';
import type { FileUploadResult } from '../../services/files';

interface FileItem extends FileUploadResult {
  id: string;
}

export const FileDemo: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [showManager, setShowManager] = useState(false);

  const handleFileSelect = (file: FileItem) => {
    setSelectedFiles(prev => {
      const existing = prev.find(f => f.id === file.id);
      if (existing) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleUploadComplete = (result: FileUploadResult) => {
    const newFile: FileItem = {
      ...result,
      id: result.file.key
    };
    setSelectedFiles(prev => [...prev, newFile]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        File Upload & Management Demo
      </h1>

      {/* Toggle between upload and manager */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowManager(false)}
            className={`px-4 py-2 rounded ${
              !showManager
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setShowManager(true)}
            className={`px-4 py-2 rounded ${
              showManager
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            File Manager
          </button>
        </div>
      </div>

      {/* Content */}
      {showManager ? (
        <FileManager
          onFileSelect={handleFileSelect}
          allowMultiple={true}
          showUpload={true}
          className="w-full"
        />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick File Upload
            </h2>
            <FileUpload
              onUploadComplete={handleUploadComplete}
              onUploadError={(error) => alert(`Upload Error: ${error}`)}
              multiple={true}
              className="w-full"
            />
          </div>

          {/* Selected files display */}
          {selectedFiles.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {file.file.filename}
                      </p>
                      <p className="text-sm text-gray-500">
                        Size: {(file.file.size / 1024).toFixed(1)} KB | 
                        Type: {file.file.content_type} |
                        Uploaded: {new Date(file.file.uploaded_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        Key: {file.file.key}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={file.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        View
                      </a>
                      <button
                        onClick={() => {
                          setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setSelectedFiles([])}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileDemo;