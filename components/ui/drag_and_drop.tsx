'use client';

import { FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { cn } from '@/lib/utils';

interface DragAndDropProps {
  onUpload: (file: File) => Promise<void>;
  acceptedFileTypes?: string;
  acceptedMimeTypes?: string[];
  title?: string;
  description?: string;
  uploadButtonText?: string;
  className?: string;
}

export default function DragAndDrop({
  onUpload,
  acceptedFileTypes = '.csv,text/csv',
  acceptedMimeTypes = ['text/csv'],
  title = 'Choose or drag and drop a CSV file',
  description = 'CSV files only. Email addresses should be in the first column.',
  uploadButtonText = 'Upload File',
  className
}: DragAndDropProps) {
  const [uploadButtonState, setUploadButtonState] = useState<ButtonLoadingState>('default');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileButtonClick = () => {
    if (fileInputRef.current !== null) {
      fileInputRef.current.click();
    }
  };

  const validateFile = (file: File): boolean => {
    return acceptedMimeTypes.includes(file.type);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    } else {
      toast.error(`Please select a valid file type: ${acceptedMimeTypes.join(', ')}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    const file = files[0];

    if (file && validateFile(file)) {
      setSelectedFile(file);
    } else {
      toast.error(`Please drop a valid file type: ${acceptedMimeTypes.join(', ')}`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploadButtonState('loading');

    try {
      await onUpload(selectedFile);

      // Clear the selected file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setUploadButtonState('success');

      // Reset button state after showing success
      setTimeout(() => setUploadButtonState('default'), 2000);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file. Please try again.');
      setUploadButtonState('error');

      // Reset button state after showing error
      setTimeout(() => setUploadButtonState('default'), 3000);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden file input */}
      <Input
        type="file"
        ref={fileInputRef}
        accept={acceptedFileTypes}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drag and drop area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          selectedFile && 'border-green-500 bg-green-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileButtonClick}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-green-800">{selectedFile.name}</span>
              <span className="text-sm text-green-600">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation();
                clearSelectedFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2 flex items-center justify-center">
            <Upload className="h-10 w-10 mx-auto pt-1 text-muted-foreground" />
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      {selectedFile && (
        <div className="flex justify-end">
          <LoadingButton
            buttonState={uploadButtonState}
            onClick={handleUpload}
            className="gap-2"
            text={
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {uploadButtonText}
              </span>
            }
            loadingText="Uploading..."
            successText="Uploaded!"
            errorText="Upload failed"
          />
        </div>
      )}
    </div>
  );
}
