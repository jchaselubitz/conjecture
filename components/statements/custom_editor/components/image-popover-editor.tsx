"use client";

import { Editor } from "@tiptap/react";
import { ImageIcon, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useUserContext } from "@/contexts/userContext";
import { deleteStatementImage } from "@/lib/actions/statementActions";
import { deleteStoredStatementImage } from "@/lib/actions/storageActions";
import { saveImage } from "./custom_extensions/helpers/helpersImageExtension";
import { NewImageData } from "./image-node-editor";

interface ImagePopoverEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageData: NewImageData;
  children: React.ReactNode;
  editor: Editor;
  statementId: string;
}

export function ImagePopoverEditor({
  open,
  onOpenChange,
  imageData,
  editor,
  statementId,
  children,
}: ImagePopoverEditorProps) {
  const { userId } = useUserContext();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(imageData.src || "");
  const [alt, setAlt] = useState(imageData.alt);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file");
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
    if (!previewUrl && !file) {
      setError("Please select an image");
      return;
    }

    if (!alt) {
      setError("Please provide alt text for accessibility");
      return;
    }

    const filename = imageData.id ? imageData.id : uuidv4();

    if (editor && userId && statementId && file) {
      await saveImage({
        editor,
        userId,
        statementId,
        imageData: {
          alt,
          src: previewUrl,
          id: filename,
        },
        file,
      });
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (!imageData.id || !imageData.src || !userId) return;

    try {
      // Remove from editor
      editor?.chain().focus().deleteBlockImage({ imageId: imageData.id }).run();

      // Delete from storage
      await deleteStoredStatementImage({
        url: imageData.src,
        creatorId: userId,
        statementId,
      });

      // Delete from database
      await deleteStatementImage(imageData.id);

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete image:", error);
      // You might want to show an error toast here
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent className="w-screen max-w-[450px] p-0" align="start">
        <div className="flex flex-col gap-4 p-4">
          {/* Image Preview */}
          <div className="border rounded-md p-3 min-h-[200px] flex items-center justify-center bg-slate-50">
            {error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={alt}
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
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />

          {/* Actions */}
          <div className="flex justify-between mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="px-2 py-1"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
