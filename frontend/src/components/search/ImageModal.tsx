
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download as DownloadIcon, X } from 'lucide-react';
import Image from 'next/image';

interface ReportPhoto {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ReportPhoto | null;
  imageList: ReportPhoto[];
  onDownload: (url: string, name: string) => void;
  onNavigate: (nextImage: ReportPhoto) => void;
}

export default function ImageModal({ isOpen, onClose, image, imageList, onDownload, onNavigate }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (image && imageList.length > 0) {
      const index = imageList.findIndex(img => img.url === image.url);
      setCurrentIndex(index !== -1 ? index : 0);
    }
  }, [image, imageList]);

  const handlePrevious = useCallback(() => {
    if (imageList.length > 0) {
      const newIndex = (currentIndex - 1 + imageList.length) % imageList.length;
      setCurrentIndex(newIndex);
      onNavigate(imageList[newIndex]);
    }
  }, [currentIndex, imageList, onNavigate]);

  const handleNext = useCallback(() => {
    if (imageList.length > 0) {
      const newIndex = (currentIndex + 1) % imageList.length;
      setCurrentIndex(newIndex);
      onNavigate(imageList[newIndex]);
    }
  }, [currentIndex, imageList, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handlePrevious, handleNext, onClose]);

  if (!image) return null;

  const currentDisplayImage = imageList[currentIndex] || image;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex flex-row justify-between items-center sticky top-0 bg-background z-10">
          <DialogTitle className="text-lg truncate" title={currentDisplayImage.name}>
            {currentDisplayImage.name}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fechar modal">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="relative aspect-video flex items-center justify-center bg-muted/20 max-h-[calc(100vh-200px)] overflow-auto">
          {imageList.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-background/70 hover:bg-background"
              onClick={handlePrevious}
              aria-label="Imagem Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          
          <Image
            src={currentDisplayImage.url}
            alt={currentDisplayImage.name}
            width={800}
            height={600}
            className="object-contain max-w-full max-h-full h-auto w-auto"
            data-ai-hint="report photograph"
          />

          {imageList.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-background/70 hover:bg-background"
              onClick={handleNext}
              aria-label="Próxima Imagem"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        <DialogFooter className="p-4 border-t flex flex-col sm:flex-row justify-between items-center bg-background">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            {currentDisplayImage.type} - {(currentDisplayImage.size / 1024 / 1024).toFixed(2)} MB
            {imageList.length > 1 && ` (Imagem ${currentIndex + 1} de ${imageList.length})`}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onDownload(currentDisplayImage.url, currentDisplayImage.name)}
              aria-label={`Baixar imagem ${currentDisplayImage.name}`}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Baixar
            </Button>
             <DialogClose asChild>
                <Button variant="secondary">Fechar</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
