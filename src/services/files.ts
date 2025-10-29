import { apiClient } from './api';

export interface FileUploadResult {
  file: {
    key: string;
    filename: string;
    content_type: string;
    size: number;
    url: string;
    uploaded_at: string;
  };
  message: string;
}

export interface SignedUrlResult {
  url: string;
  expires_in: number;
}

export class FileService {
  /**
   * Upload a file to the server
   */
  async uploadFile(file: File, _onProgress?: (progress: number) => void): Promise<FileUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiClient.getBaseURL()}/api/v1/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Download a file by key
   */
  async downloadFile(fileKey: string): Promise<Blob> {
    const response = await fetch(`${apiClient.getBaseURL()}/api/v1/files/${encodeURIComponent(fileKey)}`, {
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Download failed: ${errorData.message || 'Unknown error'}`);
    }

    return response.blob();
  }

  /**
   * Delete a file by key
   */
  async deleteFile(fileKey: string): Promise<void> {
    const response = await fetch(`${apiClient.getBaseURL()}/api/v1/files/${encodeURIComponent(fileKey)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Delete failed: ${errorData.message || 'Unknown error'}`);
    }
  }

  /**
   * Get a signed URL for temporary file access
   */
  async getSignedUrl(fileKey: string, expiresIn: string = '1h'): Promise<SignedUrlResult> {
    const response = await fetch(
      `${apiClient.getBaseURL()}/api/v1/files/${encodeURIComponent(fileKey)}/signed-url?expires=${expiresIn}`,
      {
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Signed URL failed: ${errorData.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Check if file type is allowed
   */
  isAllowedFileType(file: File): boolean {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Documents
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
      
      // Archives
      'application/zip',
      'application/x-zip-compressed',
      'application/gzip',
      'application/x-tar',
      
      // Data formats
      'application/json',
      'application/xml',
      'text/xml',
      
      // Office documents
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Generic
      'application/octet-stream',
    ];

    return allowedTypes.includes(file.type);
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit'
      };
    }

    // Check file type
    if (!this.isAllowedFileType(file)) {
      return {
        isValid: false,
        error: 'File type not allowed'
      };
    }

    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  /**
   * Generate a preview URL for images
   */
  getImagePreviewUrl(fileKey: string): string {
    // For images, we can use the direct URL
    return `${apiClient.getBaseURL()}/api/v1/files/${encodeURIComponent(fileKey)}`;
  }
}

// Create and export a singleton instance
export const fileService = new FileService();

