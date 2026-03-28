"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscountInputProps {
  className?: string;
}

export function DiscountInput({ className }: DiscountInputProps) {
  const discountCode = useCartStore((s) => s.discountCode);
  const discountPercentage = useCartStore((s) => s.discountPercentage);
  const setDiscount = useCartStore((s) => s.setDiscount);
  const clearDiscount = useCartStore((s) => s.clearDiscount);
  // Derive discount amount from stable primitives — avoids calling a function inside selector
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0)
  );
  const discountAmount = discountPercentage > 0
    ? parseFloat(((subtotal * discountPercentage) / 100).toFixed(2))
    : 0;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currency } = siteConfig;

  const handleApply = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid discount code");
      } else {
        setDiscount(data.code, data.percentage);
        setInput("");
      }
    } catch {
      setError("Could not validate code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (discountCode) {
    return (
      <div className={cn("flex items-center justify-between rounded-md bg-primary/10 px-3 py-2 text-sm", className)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium text-primary">{discountCode}</span>
          <span className="text-muted-foreground">— {discountPercentage}% off</span>
          <span className="font-semibold text-primary">
            -{formatPrice(discountAmount, currency.code, currency.locale)}
          </span>
        </div>
        <button
          type="button"
          onClick={clearDiscount}
          aria-label="Remove discount code"
          className="text-muted-foreground hover:text-destructive transition-colors ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Discount code"
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="pl-8"
            aria-label="Discount code"
            aria-describedby={error ? "discount-error" : undefined}
          />
        </div>
        <Button variant="outline" onClick={handleApply} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && (
        <p id="discount-error" className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
