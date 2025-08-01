'use client';

import { XIcon } from 'lucide-react';
import Image from 'next/image';
import { Dispatch, SetStateAction } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { UpsertImageDataType } from '@/lib/actions/statementActions';
interface ImageLightboxProps {
  src: string;
  alt: string;
  id: string;
  statementId: string;
  setInitialImageData: Dispatch<SetStateAction<UpsertImageDataType>>;
  setImageLightboxOpen: (open: boolean) => void;
}

export function ImageLightbox({
  src,
  alt,
  setInitialImageData,
  setImageLightboxOpen
}: ImageLightboxProps) {
  const handleClose = () => {
    setInitialImageData({ src: '', alt: '', id: '', statementId: '', caption: '' });
    setImageLightboxOpen(false);
  };

  return (
    <Dialog open={!!src} onOpenChange={handleClose}>
      <DialogContent className="max-w-fit max-h-fit p-0 border-none bg-transparent">
        <DialogTitle className="sr-only">Image</DialogTitle>
        <DialogDescription className="sr-only">{alt}</DialogDescription>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Close image"
        >
          <XIcon className="h-6 w-6" />
        </button>
        <div className="relative flex items-center justify-center">
          {src && (
            <div className="relative max-w-[95vw] max-h-[95vh]">
              <Image
                src={src}
                alt={alt}
                width={1000}
                height={1000}
                sizes="95vw"
                className="object-contain"
                style={{
                  maxWidth: '95vw',
                  maxHeight: '95vh',
                  width: 'auto',
                  height: 'auto'
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
