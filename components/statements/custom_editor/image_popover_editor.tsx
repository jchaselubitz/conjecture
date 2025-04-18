'use client';

import { ImageIcon, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ButtonLoadingState } from '@/components/ui/loading-button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';
import { useUserContext } from '@/contexts/userContext';
import { deleteStatementImage, upsertStatementImage } from '@/lib/actions/statementActions';

import { saveImage } from './custom_extensions/helpers/helpersImageExtension';

interface ImagePopoverEditorProps {
  children: React.ReactNode;
  statementId: string;
  statementCreatorId: string;
}

export function ImagePopoverEditor({
  statementId,
  statementCreatorId,
  children
}: ImagePopoverEditorProps) {
  const pathname = usePathname();
  const { imagePopoverOpen, setImagePopoverOpen, initialImageData, setInitialImageData } =
    useStatementToolsContext();
  const { editor, updateStatementDraft } = useStatementContext();
  const { userId } = useUserContext();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialImageData.src || '');
  const [alt, setAlt] = useState(initialImageData.alt);
  const [caption, setCaption] = useState(initialImageData.caption);
  const [error, setError] = useState<string | null>(null);
  const [saveButtonState, setSaveButtonState] = useState<ButtonLoadingState>('default');

  const handleClosePopover = () => {
    setImagePopoverOpen(false);
    setPreviewUrl('');
    setFile(null);
    setAlt('');
    setError(null);
    setInitialImageData({
      src: '',
      alt: '',
      id: '',
      caption: '',
      statementId
    });
  };

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    const img = new Image();
    img.src = url;
  };

  const handleSave = async () => {
    if (!previewUrl && !file && !initialImageData.id) {
      setError('Please select an image');
      return;
    }

    const filename = initialImageData.id ? initialImageData.id : nanoid();

    if (editor && userId && statementId) {
      const updateDraft = async () => {
        await updateStatementDraft({ content: editor.getHTML() });
      };

      try {
        setSaveButtonState('loading');
        if (file) {
          await saveImage({
            editor,
            userId,
            statementId,
            imageData: {
              alt: alt || file?.name || '',
              src: previewUrl,
              id: filename,
              caption: initialImageData.caption,
              statementId
            },
            file
          });
        }
        if (initialImageData.id) {
          await upsertStatementImage({
            alt: alt || file?.name || '',
            src: initialImageData.src,
            id: initialImageData.id,
            caption: initialImageData.caption,
            statementId,
            revalidationPath: {
              path: pathname,
              type: 'layout'
            }
          });
          updateDraft();
        }
        setSaveButtonState('success');
        handleClosePopover();
      } catch (error) {
        setSaveButtonState('error');
        console.error('Failed to save image:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (!initialImageData.id || !initialImageData.src || !userId) return;

    try {
      // Remove from editor
      editor?.chain().focus().deleteBlockImage({ imageId: initialImageData.id }).run();

      await deleteStatementImage(initialImageData.id, statementId, statementCreatorId);
      //update html right away
      handleClosePopover();
    } catch (error) {
      console.error('Failed to delete image:', error);
      // You might want to show an error toast here
    }
  };

  return (
    <Popover open={imagePopoverOpen} onOpenChange={handleClosePopover}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent className="w-screen max-w-[450px] p-0" align="start">
        <div className="flex flex-col gap-4 p-4">
          <div className="border rounded-md p-3 min-h-[200px] flex items-center justify-center bg-slate-50">
            {error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={alt || undefined}
                className="max-w-full max-h-[200px] object-contain"
              />
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8" />
                <span>No image selected</span>
              </div>
            )}
          </div>

          {/* File Input */}
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="cursor-pointer"
          />

          {/* Alt Text Input */}
          <Input
            placeholder="Alt text (for accessibility)"
            value={alt || undefined}
            onChange={(e) => setAlt(e.target.value)}
          />

          {/* Caption Input */}
          <Input
            placeholder="Caption"
            value={caption || undefined}
            onChange={(e) => setCaption(e.target.value)}
          />

          {/* Actions */}
          <div className="flex justify-between mt-2">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="px-2 py-1">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => setImagePopoverOpen(false)}>
                Cancel
              </Button>
              <LoadingButton
                size="sm"
                onClick={handleSave}
                buttonState={saveButtonState}
                text="Save"
                loadingText="Saving..."
                successText="Saved"
                errorText="Error"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
