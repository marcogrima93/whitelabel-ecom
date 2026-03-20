"use client";

import { useState, useTransition } from "react";
import { siteConfig } from "@/site.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle, Send } from "lucide-react";
import { submitQuoteAction } from "./actions";
import { PhoneInput, joinPhone, DEFAULT_COUNTRY_CODE } from "@/components/ui/phone-input";

export default function QuotePage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    categories: [] as string[],
    quantity: "",
    frequency: "",
    notes: "",
  });

  const update = (field: string, value: string | string[]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleCategory = (cat: string) => {
    const current = formData.categories;
    update(
      "categories",
      current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [...current, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await submitQuoteAction({
        name: formData.name,
        business: formData.business,
        email: formData.email,
        phone: joinPhone(phoneCountryCode, phoneNumber) || null,
        categories: formData.categories,
        quantity: formData.quantity,
        frequency: formData.frequency || null,
        notes: formData.notes || null,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || "Failed to submit quote request");
      }
    });
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Quote Request Submitted!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your interest. Our team will review your request and get
          back to you within 24 hours.
        </p>
        <Button asChild>
          <a href="/products">Browse Products</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Request a Quote</CardTitle>
          <CardDescription>
            Tell us about your wholesale needs and we&apos;ll prepare a customised quote
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="q-name">Full Name</Label>
                <Input id="q-name" value={formData.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-business">Business Name</Label>
                <Input id="q-business" value={formData.business} onChange={(e) => update("business", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="q-email">Email</Label>
                <Input id="q-email" type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-phone">Phone</Label>
                <PhoneInput
                  id="q-phone"
                  countryCode={phoneCountryCode}
                  number={phoneNumber}
                  onCountryCodeChange={setPhoneCountryCode}
                  onNumberChange={setPhoneNumber}
                />
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <Label>Products of Interest</Label>
              <div className="flex flex-wrap gap-2">
                {siteConfig.categories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      formData.categories.includes(cat.slug)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent border-input"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Est. Quantity per Order</Label>
                <Select value={formData.quantity} onValueChange={(v) => update("quantity", v)}>
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1-50 units</SelectItem>
                    <SelectItem value="51-100">51-100 units</SelectItem>
                    <SelectItem value="101-500">101-500 units</SelectItem>
                    <SelectItem value="500+">500+ units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Delivery Frequency</Label>
                <Select value={formData.frequency} onValueChange={(v) => update("frequency", v)}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Fortnightly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="one-off">One-off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-notes">Additional Notes</Label>
              <Textarea
                id="q-notes"
                placeholder="Any specific requirements, preferred products, or questions..."
                value={formData.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={4}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Submit Quote Request</>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
