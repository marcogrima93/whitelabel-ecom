"use client";

import { siteConfig } from "@/site.config";
import { X } from "lucide-react";

export function AnnouncementBar() {
  if (!siteConfig.announcement.enabled) return null;

  return (
    <div className="bg-primary text-primary-foreground text-center text-sm py-2 px-4 relative">
      <p className="font-medium">{siteConfig.announcement.text}</p>
    </div>
  );
}
