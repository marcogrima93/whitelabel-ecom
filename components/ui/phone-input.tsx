"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const COUNTRY_CODES = [
  { code: "+356", flag: "🇲🇹", country: "Malta" },
  { code: "+39",  flag: "🇮🇹", country: "Italy" },
  { code: "+44",  flag: "🇬🇧", country: "United Kingdom" },
  { code: "+353", flag: "🇮🇪", country: "Ireland" },
  { code: "+49",  flag: "🇩🇪", country: "Germany" },
  { code: "+33",  flag: "🇫🇷", country: "France" },
  { code: "+34",  flag: "🇪🇸", country: "Spain" },
  { code: "+31",  flag: "🇳🇱", country: "Netherlands" },
  { code: "+32",  flag: "🇧🇪", country: "Belgium" },
  { code: "+41",  flag: "🇨🇭", country: "Switzerland" },
  { code: "+43",  flag: "🇦🇹", country: "Austria" },
  { code: "+351", flag: "🇵🇹", country: "Portugal" },
  { code: "+1",   flag: "🇺🇸", country: "United States" },
  { code: "+61",  flag: "🇦🇺", country: "Australia" },
  { code: "+971", flag: "🇦🇪", country: "UAE" },
];

export const DEFAULT_COUNTRY_CODE = "+356";

/**
 * Splits a full phone string (e.g. "+35699123456") into { countryCode, number }.
 * Falls back to DEFAULT_COUNTRY_CODE if no match found.
 */
export function splitPhone(full: string): { countryCode: string; number: string } {
  if (!full) return { countryCode: DEFAULT_COUNTRY_CODE, number: "" };
  // Try longest prefix first to avoid "+1" matching "+356"
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (full.startsWith(c.code)) {
      return { countryCode: c.code, number: full.slice(c.code.length).trim() };
    }
  }
  return { countryCode: DEFAULT_COUNTRY_CODE, number: full };
}

/** Joins countryCode + number into a single string for storage. */
export function joinPhone(countryCode: string, number: string): string {
  return `${countryCode}${number.replace(/\s/g, "")}`;
}

interface PhoneInputProps {
  countryCode: string;
  number: string;
  onCountryCodeChange: (code: string) => void;
  onNumberChange: (number: string) => void;
  required?: boolean;
  id?: string;
}

export function PhoneInput({
  countryCode,
  number,
  onCountryCodeChange,
  onNumberChange,
  required,
  id = "phone-number",
}: PhoneInputProps) {
  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={onCountryCodeChange}>
        <SelectTrigger className="w-[110px] flex-shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {COUNTRY_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span>{c.flag}</span>
                <span className="text-muted-foreground">{c.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        placeholder="79123456"
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s]/g, ""))}
        required={required}
        className="flex-1"
        autoComplete="tel-national"
      />
    </div>
  );
}
