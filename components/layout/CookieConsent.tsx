"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("cookie-consent-dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("cookie-consent-dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t p-4 md:p-6 animate-fade-in" role="alert" aria-label="Cookie consent">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-center sm:text-left">
          <p>
            We use cookies to enhance your browsing experience. By continuing to use our
            site, you agree to our{" "}
            <a
              href="/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors font-medium"
            >
              Cookie Policy
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">Learn More</a>
          </Button>
          <Button size="sm" onClick={handleDismiss}>
            Accept & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
