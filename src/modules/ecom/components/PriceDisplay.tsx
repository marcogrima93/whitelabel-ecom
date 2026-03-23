import { formatPrice } from "../lib/utils";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({ price, compareAtPrice, size = "md" }: PriceDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`font-semibold ${sizeClasses[size]}`}>{formatPrice(price)}</span>
      {compareAtPrice && compareAtPrice > price && (
        <span className={`text-muted-foreground line-through ${size === "lg" ? "text-lg" : "text-sm"}`}>
          {formatPrice(compareAtPrice)}
        </span>
      )}
      {compareAtPrice && compareAtPrice > price && (
        <span className="text-sm font-medium text-destructive">
          {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% off
        </span>
      )}
    </div>
  );
}
