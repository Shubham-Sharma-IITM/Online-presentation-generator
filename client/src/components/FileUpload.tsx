import React, { useRef, useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  maxSize?: number;
  allowedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  selectedFile, 
  maxSize = 50 * 1024 * 1024,
  allowedTypes = ['.pptx', '.potx']
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  const validateAndSelectFile = (file: File) => {
    setUploadError(undefined);

    // Check file size
    if (file.size > maxSize) {
      setUploadError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setUploadError(`Only ${allowedTypes.join(', ')} files are allowed`);
      return;
    }

    onFileSelect(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      validateAndSelectFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        PowerPoint Template <span className="text-red-500">*</span>
      </label>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : uploadError
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {selectedFile ? (
          <div className="space-y-2">
            <FileCheck className="mx-auto h-12 w-12 text-green-600" />
            <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
            <p className="text-xs text-green-600">
              {formatFileSize(selectedFile.size)} • Ready to use
            </p>
          </div>
        ) : uploadError ? (
          <div className="space-y-2">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="text-sm font-medium text-red-800">Upload Error</p>
            <p className="text-xs text-red-600">{uploadError}</p>
            <p className="text-xs text-gray-500">Click to try again</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-600">
              Drop your {allowedTypes.join('/')} file here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Max {maxSize / (1024 * 1024)}MB • Theme will be fully preserved
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      
      {uploadError && (
        <p className="text-sm text-red-600 mt-1">{uploadError}</p>
      )}
    </div>
  );
};