"use client";

import { siteConfig } from "@/site.config";
import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  if (!siteConfig.whatsapp.enabled || !siteConfig.whatsapp.number) return null;

  const url = `https://wa.me/${siteConfig.whatsapp.number}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BA5C] hover:scale-110 transition-all duration-300 group"
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-foreground/90 px-3 py-1.5 text-sm text-background opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Chat with us
      </span>
    </a>
  );
}
