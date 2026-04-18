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
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/payment-logos/stripe.svg" alt="Stripe" className="h-8 w-auto" />
);

const PayPalLogo = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/payment-logos/paypal.svg" alt="PayPal" className="h-8 w-auto" />
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
