import React, { useState, useRef } from 'react';
import { fileService, type FileUploadResult } from '../../services/files';

interface FileUploadProps {
  onUploadComplete?: (result: FileUploadResult) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  result?: FileUploadResult;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  accept,
  multiple = false,
  className = '',
  children
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    const validFiles: File[] = [];
    
    // Validate files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = fileService.validateFile(file);
      
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        onUploadError?.(validation.error || 'Invalid file');
      }
    }

    if (validFiles.length === 0) return;

    // Initialize upload progress for all files
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files one by one
    for (const upload of newUploads) {
      try {
        const result = await fileService.uploadFile(upload.file, (progress) => {
          setUploads(prev => prev.map(u => 
            u.file === upload.file 
              ? { ...u, progress }
              : u
          ));
        });

        setUploads(prev => prev.map(u => 
          u.file === upload.file 
            ? { ...u, status: 'completed', result, progress: 100 }
            : u
        ));

        onUploadComplete?.(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setUploads(prev => prev.map(u => 
          u.file === upload.file 
            ? { ...u, status: 'error', error: errorMessage }
            : u
        ));

        onUploadError?.(errorMessage);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const clearUploads = () => {
    setUploads([]);
  };

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file));
  };

  return (
    <div className={`file-upload ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        {children || (
          <div>
            <div className="text-gray-600 mb-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, PDF up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              Uploads ({uploads.filter(u => u.status === 'completed').length}/{uploads.length})
            </h4>
            <button
              onClick={clearUploads}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          
          <div className="space-y-2">
            {uploads.map((upload, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {upload.file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({fileService.formatFileSize(upload.file.size)})
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {upload.status === 'completed' && (
                      <span className="text-green-600 text-sm">✓</span>
                    )}
                    {upload.status === 'error' && (
                      <span className="text-red-600 text-sm">✗</span>
                    )}
                    <button
                      onClick={() => removeUpload(upload.file)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {upload.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {/* Error message */}
                {upload.status === 'error' && upload.error && (
                  <p className="text-red-600 text-xs mt-1">{upload.error}</p>
                )}

                {/* Success info */}
                {upload.status === 'completed' && upload.result && (
                  <div className="text-xs text-gray-500 mt-1">
                    <p>Uploaded: {upload.result.file.key}</p>
                    <p>URL: {upload.result.file.url}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;