"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  /** Current image URL(s). Pass a single string for single-image mode, string[] for multi. */
  value: string | string[];
  onChange: (value: string | string[]) => void;
  folder?: string;
  label?: string;
  multiple?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  label,
  multiple = false,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const images = multiple
    ? (value as string[])
    : value
    ? [value as string]
    : [];

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Upload failed");
      return null;
    }
    return json.url as string;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      if (multiple) {
        const urls: string[] = [];
        for (const file of Array.from(files)) {
          const url = await uploadFile(file);
          if (url) urls.push(url);
        }
        onChange([...(value as string[]), ...urls]);
      } else {
        const url = await uploadFile(files[0]);
        if (url) onChange(url);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (url: string) => {
    if (multiple) {
      onChange((value as string[]).filter((u) => u !== url));
    } else {
      onChange("");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && <Label>{label}</Label>}

      {/* Drop zone */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="h-8 w-8" />
            <p className="text-sm font-medium">Click or drag & drop to upload</p>
            <p className="text-xs">PNG, JPG, WebP up to 5 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Preview */}
      {images.length > 0 && (
        <div className={cn("flex gap-2", multiple ? "flex-wrap" : "")}>
          {images.map((url) => (
            <div key={url} className="relative group h-20 w-20 rounded-md overflow-hidden border bg-muted shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(url); }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white"
                aria-label="Remove image"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
          {!multiple && images.length === 0 && (
            <div className="h-20 w-20 rounded-md border bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
