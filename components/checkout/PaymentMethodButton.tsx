"use client";

import { Banknote } from "lucide-react";

interface PaymentMethodButtonProps {
  gatewayId: string;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

// ─── SVG brand logos ──────────────────────────────────────────────────────────

const StripeLogo = () => (
  <svg viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <path
      d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.44 10.44 0 01-4.56.92c-4.01 0-6.83-2.5-6.83-7.48 0-4.2 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.36 0 .4-.02 1.13-.06 1.8zm-5.92-4.9c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.1-2.58-2.08-2.58zm-13.8-2.6c-1.25 0-2.06.59-2.06 1.48 0 1.04.8 1.49 2.67 2.14 2.7.92 4.4 2.17 4.4 4.68 0 3.11-2.44 4.87-5.83 4.87-1.74 0-3.47-.4-5.04-1.16V15.2c1.44.82 3.1 1.35 4.55 1.35 1.34 0 2.15-.56 2.15-1.55 0-1.07-.76-1.52-2.75-2.2C35.36 12 33.73 10.74 33.73 8.3c0-2.95 2.25-4.7 5.45-4.7 1.61 0 3.19.37 4.6 1.04v3.56a9.13 9.13 0 00-4.06-1.43zm-13.65 9.65V7.1h-3.47V3.89h3.47V.8l4.1-1.23v4.32h3.5V7.1h-3.5v8.57c0 1.3.53 1.77 1.6 1.77.7 0 1.33-.18 1.9-.5v3.3a7.2 7.2 0 01-3.02.6c-2.87 0-4.58-1.5-4.58-4.83zM17.01 3.6C15.77 3.6 15 4.4 15 5.56c0 1.04.67 1.77 1.65 2.16 2.12.82 3.08 2.05 3.08 4.1 0 3.11-2.15 4.82-5.17 4.82-1.55 0-3.1-.44-4.44-1.19V12c1.23.77 2.64 1.3 3.96 1.3 1.13 0 1.78-.5 1.78-1.41 0-.97-.6-1.4-2.42-2.07C11.28 9 9.75 7.8 9.75 5.4 9.75 2.56 11.94.98 14.92.98c1.43 0 2.84.36 4.06.98v3.47a7.76 7.76 0 00-3.43-.91l.46.08z"
      fill="white"
    />
  </svg>
);

const PayPalLogo = () => (
  <svg viewBox="0 0 100 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <path
      d="M12.237 2.042H5.795a.872.872 0 00-.861.738L2.13 20.632a.524.524 0 00.517.605h3.072a.872.872 0 00.861-.738l.656-4.163a.872.872 0 01.86-.738h2.038c4.24 0 6.686-2.05 7.324-6.116.288-1.777.012-3.172-.82-4.149-.916-1.073-2.54-1.69-4.4-1.69z"
      fill="#253B80"
    />
    <path
      d="M13.057 8.217c-.638 4.066-3.084 6.116-7.324 6.116H3.695a.524.524 0 00-.517.605l-1.116 7.07a.524.524 0 00.517.604h2.42a.524.524 0 00.517-.443l.214-1.358.413-2.622.027-.147a.524.524 0 01.517-.443h.327c2.12 0 3.779-.432 4.785-1.284.898-.765 1.394-1.91 1.538-3.497a4.25 4.25 0 01-.286-4.7z"
      fill="#179BD7"
    />
    <path
      d="M28.237 2.042h-6.442a.872.872 0 00-.861.738L18.13 20.632a.524.524 0 00.517.605h3.072a.872.872 0 00.861-.738l.656-4.163a.872.872 0 01.86-.738h2.038c4.24 0 6.686-2.05 7.324-6.116.288-1.777.012-3.172-.82-4.149-.916-1.073-2.54-1.69-4.4-1.69z"
      fill="#253B80"
    />
    <path
      d="M29.057 8.217c-.638 4.066-3.084 6.116-7.324 6.116h-2.038a.524.524 0 00-.517.605l-1.116 7.07a.524.524 0 00.517.604h2.42a.524.524 0 00.517-.443l.214-1.358.413-2.622.027-.147a.524.524 0 01.517-.443h.327c2.12 0 3.779-.432 4.785-1.284.898-.765 1.394-1.91 1.538-3.497a4.25 4.25 0 01-.286-4.7z"
      fill="#179BD7"
    />
    <text x="36" y="20" fill="white" fontSize="14" fontFamily="Arial, sans-serif" fontWeight="bold">PayPal</text>
  </svg>
);

const RevolutLogo = () => (
  <svg viewBox="0 0 110 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <circle cx="14" cy="14" r="14" fill="white" />
    <path
      d="M10 7h6.5c2.485 0 4.5 2.015 4.5 4.5S18.985 16 16.5 16H14l4 5h-3l-4-5V7zm3 2.5v4h3.5a2 2 0 000-4H13z"
      fill="#191C1F"
    />
    <text x="32" y="20" fill="white" fontSize="13" fontFamily="Arial, sans-serif" fontWeight="bold" letterSpacing="0.5">Revolut</text>
  </svg>
);

const MollieLogo = () => (
  <svg viewBox="0 0 90 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <rect x="0" y="4" width="20" height="20" rx="4" fill="white" />
    <path d="M4 14c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="#FF5B24" />
    <text x="26" y="20" fill="white" fontSize="13" fontFamily="Arial, sans-serif" fontWeight="bold">Mollie</text>
  </svg>
);

const SkrillLogo = () => (
  <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <text x="0" y="20" fill="white" fontSize="18" fontFamily="Arial, sans-serif" fontWeight="bold" letterSpacing="-0.5">Skrill</text>
  </svg>
);

const TrustPaymentsLogo = () => (
  <svg viewBox="0 0 130 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <path d="M6 4h16v4H6zm5 4h6v14h-6z" fill="white" />
    <text x="28" y="20" fill="white" fontSize="12" fontFamily="Arial, sans-serif" fontWeight="bold">Trust Payments</text>
  </svg>
);

const SumUpLogo = () => (
  <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <text x="0" y="20" fill="white" fontSize="18" fontFamily="Arial, sans-serif" fontWeight="bold">SumUp</text>
  </svg>
);

const MyPosLogo = () => (
  <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <text x="0" y="20" fill="white" fontSize="18" fontFamily="Arial, sans-serif" fontWeight="bold">myPOS</text>
  </svg>
);

const FondyLogo = () => (
  <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <text x="0" y="20" fill="white" fontSize="18" fontFamily="Arial, sans-serif" fontWeight="bold">Fondy</text>
  </svg>
);

const BovLogo = () => (
  <svg viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <text x="0" y="20" fill="white" fontSize="18" fontFamily="Arial, sans-serif" fontWeight="bold">BOV</text>
  </svg>
);

// ─── Brand config per gateway ─────────────────────────────────────────────────

const BRAND_CONFIG: Record<string, {
  Logo: () => JSX.Element;
  bg: string;
  selectedRing: string;
  checkColor: string;
}> = {
  stripe: {
    Logo: StripeLogo,
    bg: "bg-[#635bff]",
    selectedRing: "ring-[#4f46e5]",
    checkColor: "text-white",
  },
  paypal: {
    Logo: PayPalLogo,
    bg: "bg-[#003087]",
    selectedRing: "ring-[#009cde]",
    checkColor: "text-[#009cde]",
  },
  revolut: {
    Logo: RevolutLogo,
    bg: "bg-[#191C1F]",
    selectedRing: "ring-white/60",
    checkColor: "text-white",
  },
  mollie: {
    Logo: MollieLogo,
    bg: "bg-[#1a1a2e]",
    selectedRing: "ring-[#FF5B24]",
    checkColor: "text-[#FF5B24]",
  },
  skrill: {
    Logo: SkrillLogo,
    bg: "bg-[#862165]",
    selectedRing: "ring-[#c43b8a]",
    checkColor: "text-white",
  },
  trustPayments: {
    Logo: TrustPaymentsLogo,
    bg: "bg-[#0078a0]",
    selectedRing: "ring-[#00b4d8]",
    checkColor: "text-white",
  },
  bov: {
    Logo: BovLogo,
    bg: "bg-[#cc0000]",
    selectedRing: "ring-[#ff3333]",
    checkColor: "text-white",
  },
  fondy: {
    Logo: FondyLogo,
    bg: "bg-[#0055cc]",
    selectedRing: "ring-[#3385ff]",
    checkColor: "text-white",
  },
  myPos: {
    Logo: MyPosLogo,
    bg: "bg-[#ff6600]",
    selectedRing: "ring-[#ff9944]",
    checkColor: "text-white",
  },
  sumUp: {
    Logo: SumUpLogo,
    bg: "bg-[#00b050]",
    selectedRing: "ring-[#00e066]",
    checkColor: "text-white",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentMethodButton({
  gatewayId,
  label,
  description,
  isSelected,
  onClick,
}: PaymentMethodButtonProps) {
  const brand = BRAND_CONFIG[gatewayId];

  // ── Branded button ──────────────────────────────────────────────────────────
  if (brand) {
    const { Logo, bg, selectedRing } = brand;
    return (
      <button
        type="button"
        onClick={onClick}
        className={`
          relative flex flex-col items-center justify-center gap-2
          px-4 py-5 rounded-xl border-2 transition-all duration-150
          ${bg}
          ${isSelected
            ? `border-white/80 ring-2 ring-offset-2 ${selectedRing} shadow-lg scale-[1.02]`
            : "border-white/10 hover:border-white/30 hover:scale-[1.01]"
          }
        `}
        aria-pressed={isSelected}
      >
        {/* Selected check mark */}
        {isSelected && (
          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
            <svg viewBox="0 0 12 12" className="h-3 w-3 text-white fill-white">
              <path d="M1.5 6l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </span>
        )}
        <Logo />
        <p className="text-xs text-white/70 text-center leading-tight">{description}</p>
      </button>
    );
  }

  // ── Cash / unbranded fallback ───────────────────────────────────────────────
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-5 rounded-xl border-2 text-left transition-all duration-150
        ${isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 shadow-md scale-[1.02]"
          : "border-input bg-background hover:bg-accent hover:scale-[1.01]"
        }
      `}
      aria-pressed={isSelected}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
        <Banknote className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div>
        <p className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {isSelected && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <svg viewBox="0 0 12 12" className="h-3 w-3">
            <path d="M1.5 6l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </span>
      )}
    </button>
  );
}
