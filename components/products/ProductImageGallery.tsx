"use client";

import { ShoppingBag } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  name: string;
  /** Controlled: index of image to show as main. When provided, internal selection is overridden. */
  activeIndex?: number;
  onSelect?: (index: number) => void;
}

export function ProductImageGallery({ images, name, activeIndex, onSelect }: ProductImageGalleryProps) {
  const hasImages = images && images.length > 0;
  const selected = activeIndex ?? 0;

  const handleSelect = (i: number) => {
    onSelect?.(i);
  };

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl overflow-hidden relative">
        {hasImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[selected]}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasImages && images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`aspect-square rounded-lg overflow-hidden relative border-2 transition-all ${
                selected === i ? "border-primary" : "border-transparent hover:border-primary/40"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${name} image ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
